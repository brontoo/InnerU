/* ============================================================================
   Read this page aloud, with word-level highlighting
   ----------------------------------------------------------------------------
   Uses the speech engine built into the browser: no audio files, no network, no
   cost, and it works offline. One control reads the page in order and follows
   along word by word, which is what actually helps a reader who is still
   decoding English science vocabulary.
   ========================================================================== */
(() => {
  'use strict';

  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;

  /* Headings and answer options are included: in a quiz, reading the question
     and its choices aloud is the whole point. */
  const BLOCKS = '#main p, #main h2, #main h3, #main blockquote, #main figcaption, #main .note, #main .choice';
  let queue = [], index = 0, speaking = false, current = null, mark = null, lastLayoutAt = 0;

  const prefs = () => {
    if (!state.speech || typeof state.speech !== 'object') state.speech = {};
    if (typeof state.speech.rate !== 'number') state.speech.rate = 1;
    return state.speech;
  };

  function blocks() {
    return [...document.querySelectorAll(BLOCKS)].filter(el => {
      if (el.closest('nav, footer, aside, .topbar, .teacher-table, [data-no-tts]')) return false;
      return el.textContent.trim().length >= 40;
    });
  }

  function clearMark() {
    if (!mark) return;
    const parent = mark.parentNode;
    if (parent) { parent.replaceChild(document.createTextNode(mark.textContent), mark); parent.normalize(); }
    mark = null;
  }

  /* wrap the word that starts at charIndex inside block */
  function highlight(block, charIndex) {
    clearMark();
    if (!block) return null;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let acc = 0, node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue, len = text.length;
      if (charIndex < acc + len) {
        const local = charIndex - acc;
        const rest = text.slice(local);
        const word = /^\S+/.exec(rest);
        if (!word) return null;
        const range = document.createRange();
        range.setStart(node, local);
        range.setEnd(node, local + word[0].length);
        const el = document.createElement('mark');
        el.className = 'tts-word';
        try { range.surroundContents(el); } catch (e) { return null; }
        mark = el;
        return el;
      }
      acc += len;
    }
    return null;
  }

  function status(message) {
    const el = document.getElementById('tts-status');
    if (el) el.textContent = message;
  }

  /* A visible note, because a student who taps Listen and hears nothing needs to
     be told why rather than left guessing. */
  function fail(message) {
    status(message);
    const note = document.getElementById('tts-note');
    if (note) { note.textContent = message; note.classList.add('is-visible'); }
  }

  function ui() {
    const box = document.getElementById('reader-tools') || (() => {
      const topbar = document.querySelector('.topbar');
      if (!topbar) return null;
      const b = document.createElement('div');
      b.className = 'reader-tools';
      b.id = 'reader-tools';
      topbar.append(b);
      return b;
    })();
    if (!box) return;
    if (!box.querySelector('#tts-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'tts-toggle';
      toggle.className = 'reader-btn';
      toggle.onclick = () => { speaking ? stop() : start(); };
      const rate = document.createElement('button');
      rate.type = 'button';
      rate.id = 'tts-rate';
      rate.className = 'reader-btn reader-btn-rate';
      rate.onclick = () => {
        const steps = [0.8, 1, 1.2, 1.5];
        const p = prefs();
        p.rate = steps[(steps.indexOf(p.rate) + 1) % steps.length] || 1;
        save();
        render();
      };
      const note = document.createElement('span');
      note.id = 'tts-note';
      note.className = 'reader-note';
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      const live = document.createElement('span');
      live.id = 'tts-status';
      live.className = 'sr-only';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      box.append(toggle, rate, note, live);
    }
    render();
  }

  function render() {
    const toggle = document.getElementById('tts-toggle');
    const rate = document.getElementById('tts-rate');
    if (!toggle || !rate) return;
    toggle.textContent = speaking ? '\u25a0 Stop' : '\u25b6 Listen';
    toggle.setAttribute('aria-pressed', String(speaking));
    toggle.title = speaking ? 'Stop reading' : 'Read this page aloud';
    rate.textContent = prefs().rate.toFixed(1).replace(/\.0$/, '') + '\u00d7';
    rate.title = 'Reading speed';
    rate.setAttribute('aria-label', 'Reading speed ' + prefs().rate + ' times normal');
  }

  function speak(index_) {
    if (index_ >= queue.length) { stop(); return; }
    index = index_;
    current = queue[index_];
    current.classList.add('is-reading');
    const text = current.textContent.trim();
    const u = new SpeechSynthesisUtterance(text);
    const p = prefs();
    u.lang = 'en-GB';
    u.rate = p.rate;
    u.onboundary = e => { if (e.name === 'word' || e.charIndex !== undefined) highlight(current, e.charIndex || 0); };
    u.onend = () => {
      clearMark();
      if (current) current.classList.remove('is-reading');
      if (speaking) speak(index_ + 1);
    };
    u.onerror = () => { fail('Reading aloud is not available on this device.'); stop(); };
    window.speechSynthesis.speak(u);
  }

  function start() {
    if (speaking) return;
    const note = document.getElementById('tts-note');
    if (note) { note.classList.remove('is-visible'); note.textContent = ''; }
    queue = blocks();
    if (!queue.length) { status('There is nothing to read on this page.'); return; }
    speaking = true;
    render();
    status('Reading the page aloud. Press Stop to finish.');
    speak(0);
  }

  function stop() {
    speaking = false;
    queue = []; index = 0;
    try { window.speechSynthesis.cancel(); } catch (e) { /* nothing to cancel */ }
    clearMark();
    if (current) { current.classList.remove('is-reading'); current = null; }
    render();
    status('Stopped.');
  }

  const previousLayout = layout;
  layout = function (...args) {
    previousLayout(...args);
    if (speaking) stop();
    lastLayoutAt = Date.now();
    ui();
  };

  window.inneruSpeech = {
    start, stop, speakText: text => {
      stop();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = prefs().rate;
      u.onend = () => status('Finished.');
      window.speechSynthesis.speak(u);
    },
    isSpeaking: () => speaking,
    rate: () => prefs().rate,
    blocks,
    _highlight: i => highlight(current || blocks()[0], i)
  };

  ui();
})();
