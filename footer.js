/* Discord pill: copy the ID, swap the label, hold, swap back. While the
   confirmation is up the button is armed — a second click opens Discord, which
   the confirmation itself says.

   The width animation is driven from JS because CSS cannot transition to the
   intrinsic width of a piece of text. Both labels are in the DOM already, so we
   measure them once (and again whenever the language changes) and write the
   right one onto .swap — the button, being inline-flex, follows along. */
(function () {
  var btn = document.getElementById('discord');
  if (!btn) return;

  var DISCORD_URL = 'https://discord.com/channels/@me';
  var HOLD = 5000;

  var swap = btn.querySelector('.swap');
  var idle = btn.querySelector('.swap-idle');
  var done = btn.querySelector('.swap-done');

  var idleW = 0;
  var doneW = 0;
  var timer = null;

  function measure() {
    idleW = idle.offsetWidth;
    doneW = done.offsetWidth;
    swap.style.width = (btn.classList.contains('is-copied') ? doneW : idleW) + 'px';
  }

  function copy(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value);
    }
    /* http:// and older Safari never see navigator.clipboard */
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  function label() {
    btn.setAttribute('aria-label',
      btn.dataset[btn.classList.contains('is-copied') ? 'labelOpen' : 'labelCopy']);
  }

  function reset() {
    btn.classList.remove('is-copied');
    swap.style.width = idleW + 'px';
    label();
    timer = null;
  }

  btn.addEventListener('click', function () {
    if (btn.classList.contains('is-copied')) {
      window.open(DISCORD_URL, '_blank', 'noopener');
      if (timer) clearTimeout(timer);
      reset();
      return;
    }
    copy(btn.getAttribute('data-copy')).then(function () {
      btn.classList.add('is-copied');
      swap.style.width = doneW + 'px';
      label();
      if (timer) clearTimeout(timer);
      timer = setTimeout(reset, HOLD);
    }).catch(function () {});
  });

  /* Fonts land after first paint and would leave the measurement short. */
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  document.addEventListener('i18n:applied', function () {
    /* The new strings are a different length; drop any copied state with them.
       apply() has just rewritten aria-label to the idle one, which matches. */
    if (timer) { clearTimeout(timer); timer = null; }
    btn.classList.remove('is-copied');
    measure();
  });
})();
