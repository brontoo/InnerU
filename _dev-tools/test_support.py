"""Portable local-only browser/fixture support for the critical release checks."""
import atexit
import json
import os
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright as _playwright

ROOT = Path(__file__).resolve().parents[1]
CONTAINER = os.environ.get('INNERU_DB_TEST_CONTAINER', 'inneru-db-check')
ARTIFACTS = Path(os.environ.get('INNERU_TEST_ARTIFACT_DIR') or tempfile.mkdtemp(prefix='inneru-check-')).resolve()
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def artifact(name):
    return str(ARTIFACTS / name)


def launch(pw):
    # Use the revision installed by `python -m playwright install chromium`.
    override = os.environ.get('INNERU_TEST_CHROMIUM_EXECUTABLE')
    return pw.chromium.launch(**({'executable_path': override} if override else {}),
                              args=['--no-sandbox', '--enable-unsafe-swiftshader'])


_contexts = []

def new_context(browser, **options):
    context = browser.new_context(**options)
    def local_only(route):
        url = urlsplit(route.request.url)
        if url.scheme not in ('http', 'https') or url.hostname in ('127.0.0.1', 'localhost', '::1'):
            route.continue_()
        else:
            route.abort()
    context.route('**/*', local_only)
    _contexts.append(context)
    return context


@contextmanager
def playwright_session():
    with _playwright() as pw:
        try:
            yield pw
        except BaseException:
            # Capture before Playwright tears down the failed page/driver.
            for i, page in enumerate(_pages()):
                try:
                    page.screenshot(path=artifact(f'failure-{i + 1}.png'), full_page=True, timeout=5000)
                except Exception:
                    pass
            raise


def _pages():
    return [page for context in _contexts for page in context.pages if not page.is_closed()][-4:]


def start_fixture(env=None, database=False):
    values = dict(os.environ if env is None else env)
    for key in list(values):
        if key.startswith('SUPABASE_') or key in ('APP_ORIGIN', 'VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL'):
            values.pop(key)
    if not database:
        values.pop('INNERU_DB_TEST_CONTAINER', None)
        values.pop('INNERU_DB_TEST_DATABASE', None)
    else:
        values['INNERU_DB_TEST_CONTAINER'] = CONTAINER
        with open(artifact('database-setup.log'), 'w', encoding='utf-8') as setup_log:
            subprocess.run([sys.executable, str(ROOT / '_dev-tools/prepare-db-tests.py')], env=values, check=True,
                           stdout=setup_log, stderr=subprocess.STDOUT)
    errors = open(artifact('fixture.log'), 'w', encoding='utf-8')
    proc = subprocess.Popen(['node', str(ROOT / '_dev-tools/account-test-server.js')], env=values,
                            stdout=subprocess.PIPE, stderr=errors, text=True)
    def stop():
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
        errors.close()
    atexit.register(stop)
    try:
        origin = json.loads(proc.stdout.readline())['origin']
        if urlsplit(origin).hostname != '127.0.0.1':
            raise RuntimeError('The test fixture must use loopback.')
        return proc, origin
    except Exception:
        stop()
        raise RuntimeError(f'Local test fixture failed to start. See {artifact("fixture.log")}') from None


class DatabaseFixture:
    """Run real SQL/API permissions with fake Auth and loopback-only browser contexts."""
    def __init__(self, database):
        self.database = database
        self.env = {**os.environ, 'INNERU_DB_TEST_CONTAINER': CONTAINER, 'INNERU_DB_TEST_DATABASE': database}
        self.proc, self.origin = start_fixture(self.env, database=True)

    def sql(self, statement):
        return subprocess.check_output(['docker', 'exec', '-i', CONTAINER, 'psql', '-U', 'postgres',
                                       '-d', self.database, '-v', 'ON_ERROR_STOP=1', '-qAt'],
                                      input=statement, text=True).strip()

    def api(self, page, action, data=None):
        url = self.origin + '/api/learning?action=' + action
        return page.request.get(url) if data is None else page.request.post(url, data=data)

    def account(self, browser, email, name, code=None):
        context = new_context(browser, service_workers='block', viewport={'width': 1680, 'height': 1100}, accept_downloads=True)
        page = context.new_page()
        response = page.request.post(self.origin + '/api/auth?action=signup', data={
            'email': email, 'password': 'Local-Release-Fixture-123', 'name': name, 'avatarId': 'sage',
            'requestedRole': 'student' if code else 'teacher', **({'classCode': code} if code else {})})
        assert response.ok, response.text()
        user = response.json()['user']
        if code is None:
            self.sql("select public.inneru_approve_teacher('" + email.replace("'", "''") + "');")
        return page, user

    def open(self, page, route, selector):
        page.goto(self.origin + '/index.html?nosw=1#' + route)
        page.wait_for_selector(selector)
        if selector == '.sd-page':
            page.wait_for_function('InneruCloud.status()==="Saved to your account"')

    def unlock(self, teacher, code='10G5'):
        for system in ['integumentary', 'skeletal', 'muscle', 'respiratory', 'circ', 'excretory']:
            response = self.api(teacher, 'set-mission-control', {'classCode': code, 'system': system, 'number': 0, 'unlocked': True})
            assert response.ok, response.text()

    def close(self):
        self.proc.terminate()
        self.proc.wait(timeout=10)
