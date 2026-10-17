"""Current login verification: real account adapter plus the illustrated entry."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('verify-accounts.py')),run_name='__main__')
