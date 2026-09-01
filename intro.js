/* First-load intro for the two lines of the <h1>.

   Line 1 -- "Nice to meet you! I'm…" -- rises one glyph at a time. Every glyph
   gets its own overflow:hidden window, so a character is invisible until it
   climbs into its own slot: the reels of a slot machine or a split-flap
   departure board, not one long shutter drawn across the whole line.

   Line 2 -- "Kind Mita" -- is the codepen.io/creativeocean move: a flat bar
   shoots out from the left edge to the full width of the name, then peels away
   to the right while the name materialises in its wake.

   What the bar uncovers is a flat word, in the bar's own colour. The colour
   arrives afterwards, on reels again: every character is a two-cell strip
   holding the same glyph flat and gradient-filled, and each one rolls from the
   first to the second -- 40ms apart down the line, each spinning whichever way
   it drew. The letter never changes, only what it is painted with.

   That means the title does get cut into characters, which the whole-word
   gradient ::after cannot be. So the layers trade places: ::after is switched
   off and each cell carries its own copy of the same gradient, over the same
   one-line-box area, which makes them the same pixels.

   The body copy comes last, and it arrives quietly: each paragraph simply
   fades and lifts up into place from just below its own slot, one paragraph
   after the other.

   The chips are what used to be the copy's move: thrown in from past the
   right edge of the window, all starting at the same offset and released a
   few milliseconds apart, so what the eye reads is not chips moving but the
   gaps between them collapsing as each slides home.

   Neither line of the title uses an in-out ease, and neither do the chips:
   everything here either launches hard and settles (both sets of reels, the
   bar opening, the chips) or winds up and leaves (the bar exit). */
(function () {
  var root = document.documentElement;
  var h1 = document.querySelector('.hero h1');
  if (!h1) return;

  var greet    = h1.querySelector('.greet');
  var nameLine = h1.querySelector('.name-line');
  var name     = h1.querySelector('.name');
  var bar      = h1.querySelector('.name-bar');
  var paras    = Array.prototype.slice.call(document.querySelectorAll('.col-left p'));
  var chips    = Array.prototype.slice.call(document.querySelectorAll('.chips > li'));

  /* --p is where the mask cuts, in % of the name's width; everything to its
     left is drawn. The bar's left edge rides the same value, so a glyph clears
     the mask at the instant the bar stops covering it. 130% parks the cut past
     the right edge = fully drawn, which is also the value CSS starts from so
     the page is readable with this script removed. */
  var HIDDEN = 0;
  var SHOWN  = 130;

  function setSweep(p) {
    name.style.setProperty('--p', p + '%');
  }

  function reveal() {
    root.classList.remove('js-intro');
  }

  /* The resting state, reached either by finishing or by never starting. Note
     it does not put the reels back: whenever it runs the title is plain text
     again -- untouched on the no-gsap and reduced-motion paths, rewritten by
     i18n on a language switch -- so dropping --grad-o hands the word back to
     the ::after gradient, which is the render the page ships with. */
  function finish() {
    setSweep(SHOWN);
    name.style.removeProperty('--grad-o');
    if (bar) bar.style.display = 'none';
    reveal();
  }

  if (!window.gsap || !window.SplitText || !window.CustomEase) { finish(); return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }

  /* From here the intro is going to run, so the <head> safety net -- which
     would otherwise uncover the finished title mid-way through a slow web font
     fetch -- is no longer wanted. */
  clearTimeout(window.__introFallback);
  setSweep(HIDDEN);
  name.style.setProperty('--grad-o', '0');

  gsap.registerPlugin(SplitText, CustomEase);

  /* A reel does not glide to a stop. It overshoots its slot, drops back a
     hair, and twitches once before it settles -- two dying bounces on the way
     out of a near-vertical launch. */
  CustomEase.create('reelSettle',
    'M0,0 C0.145,0.86 0.2,1.062 0.355,1.062 0.505,1.062 0.61,0.982 0.735,0.997 0.85,1.011 0.9,1 1,1');

  /* The copy cannot bounce. Its travel is most of the window's width, so an
     overshoot of even two percent would be a twenty-pixel lurch backwards on a
     fourteen-pixel face -- a stutter, not a settle. So the character goes into
     the deceleration instead of past the end of it: the word leaves hard,
     covers nine tenths of the distance in the first quarter of its time, and
     spends the remaining three quarters easing the last sliver shut. It is
     legible long before it is finished moving, which is what lets the stagger
     run this tight without the paragraph turning into a smear. */
  CustomEase.create('copyDrift',
    'M0,0 C0.062,0.492 0.128,0.796 0.242,0.898 0.345,0.99 0.52,0.9995 1,1');

  /* The bar leaves the way a wipe should: almost still, then gone. */
  CustomEase.create('barExit',
    'M0,0 C0.3,0 0.52,0.055 0.68,0.235 0.815,0.39 0.9,0.67 1,1');

  var split = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  /* SplitText hands back one span per glyph; each of those is then dropped
     into its own window. Spaces stay in the word wrappers, so they are never
     boxed and the line still wraps on word boundaries. */
  function splitGreeting(stale) {
    if (split && !stale) split.revert();
    split = new SplitText(greet, {
      type: 'words,chars',
      tag: 'span',            /* the default is <div>, which cannot legally sit inside the slot <span> */
      wordsClass: 'g-word',
      charsClass: 'g-char'
    });
    split.chars.forEach(function (ch) {
      var slot = document.createElement('span');
      slot.className = 'g-slot';
      ch.parentNode.insertBefore(slot, ch);
      slot.appendChild(ch);
    });
    return split.chars;
  }

  /* Cuts the title into per-character reels and returns the strips to roll.
     Direction is drawn per character, so which way any given letter turns
     changes from load to load. */
  function buildReels() {
    var node = name.firstChild;
    if (!node || node.nodeType !== 3) return [];

    var text = node.nodeValue;
    var origin = name.getBoundingClientRect().left;
    var em = parseFloat(getComputedStyle(name).fontSize);
    var range = document.createRange();
    var frag = document.createDocumentFragment();
    var slots = [], rolls = [], targets = [];

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      /* spaces stay as text, so the word gap keeps its own advance */
      if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); continue; }

      /* where the intact, kerned line put this glyph */
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      targets.push(range.getBoundingClientRect().left - origin);

      var down  = Math.random() < 0.5;
      var slot  = el('span', 'n-slot');
      var roll  = el('span', 'n-roll');
      var solid = el('span', 'n-cell n-solid', ch);
      var grad  = el('span', 'n-cell n-grad', ch);
      /* the cell it rests on is always the gradient one; which end of the
         strip that is decides which way the strip has to travel */
      roll.appendChild(down ? grad : solid);
      roll.appendChild(down ? solid : grad);
      roll.__down = down;
      slot.appendChild(roll);
      frag.appendChild(slot);
      slots.push(slot);
      rolls.push(roll);
    }

    name.textContent = '';
    name.appendChild(frag);

    /* Every box is nudged back onto the x the unsplit line had given it, so
       whatever the face does between two letters survives being cut apart.
       Expressed in em, so it still holds when the clamped font-size changes
       with the viewport. */
    var left = name.getBoundingClientRect().left;
    for (var j = 0; j < slots.length; j++) {
      var d = targets[j] - (slots[j].getBoundingClientRect().left - left);
      if (Math.abs(d) > 0.02) slots[j].style.marginLeft = (d / em) + 'em';
    }
    return rolls;
  }

  /* -50% of a two-cell strip is exactly one cell. Kept as a percentage of the
     strip's own height rather than a pixel offset so the resting position
     survives the viewport, and the font-size with it, changing afterwards. */
  function restAt(i, roll) { return roll.__down ? 0 : -50; }
  function startAt(i, roll) { return roll.__down ? -50 : 0; }

  /* The bar has to read as a slab the size of the word, and the two title
     faces do not sit the same way inside the line box -- the Chinese face
     rides higher, so a bar pinned to em offsets picked off the Latin one left
     the tops of the characters standing out above it. Measured off whichever
     face is actually loaded instead, and written back in em so it still holds
     when the clamped font-size changes with the viewport. */
  function fitBar() {
    var cs = getComputedStyle(name);
    var fs = parseFloat(cs.fontSize);
    var lh = parseFloat(cs.lineHeight);
    var ctx = document.createElement('canvas').getContext('2d');
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;

    var m = ctx.measureText(name.textContent);
    /* ink extents of this actual string, and the face's own box, which is what
       decides where the baseline lands inside the line box */
    var vals = [m.actualBoundingBoxAscent, m.actualBoundingBoxDescent,
                m.fontBoundingBoxAscent, m.fontBoundingBoxDescent];
    var ok = vals.every(function (v) { return typeof v === 'number' && isFinite(v); });
    if (!ok) return;  /* no metrics: leave the stylesheet's fallback alone */

    var baseline = (lh - (vals[2] + vals[3])) / 2 + vals[2];
    var pad = 0.06 * fs;
    bar.style.top    = ((baseline - vals[0] - pad) / fs) + 'em';
    bar.style.height = ((vals[0] + vals[1] + pad * 2) / fs) + 'em';
  }

  function play() {
    var chars = splitGreeting(false);

    /* out of .js-intro's hands and into gsap's before the class is dropped,
       so there is no frame where either is drawn in its finished state */
    if (paras.length) gsap.set(paras, { autoAlpha: 0, y: 18 });

    /* One offset for all of them, and it is the distance from the left edge of
       the chip row to the right edge of the window: the first chip starts just
       past the edge, and every chip after it starts that same distance to the
       right of wherever it belongs, which puts most of the row well off the
       page. The gaps the eye ends up reading are not this number -- they are
       what the stagger opens up between neighbours, and they shut from the
       left of the row rightward. */
    var throwFrom = chips.length
      ? window.innerWidth - chips[0].getBoundingClientRect().left + 32
      : 0;
    if (chips.length) gsap.set(chips, { autoAlpha: 0, x: throwFrom });
    fitBar();          /* while .name still holds the plain, measurable word */
    var rolls = buildReels();

    /* Measured after the reels are built, and once the title face is in: the
       bar has to open to exactly the width of the word it is standing in for,
       as that word is actually laid out. Not rounded -- the mask cut is
       a percentage of that same box, and rounding the px side of the pair is
       what lets the two edges separate. */
    var width = name.getBoundingClientRect().width;

    /* The bar's right edge is pinned at `width` for the whole exit -- it is
       the left edge that runs right, shrinking the bar to nothing -- and the
       mask's transparent edge rides that same left edge. One tween drives
       both so they cannot drift apart. */
    var sweep = { p: HIDDEN };
    function onSweep() {
      setSweep(sweep.p);
      var left = Math.min(width, width * sweep.p / 100);
      /* a pixel early, so the bar's leading edge always sits on top of the
         mask's cut rather than beside it -- see the mask note in styles.css */
      var bx = Math.max(0, left - 1);
      /* written straight to the element, not through gsap.set: a set() called
         from inside an onUpdate is queued onto the global timeline and lands a
         frame later, which is exactly long enough for the bar and the cut to
         come apart on screen. */
      bar.style.transform = 'translateX(' + bx + 'px)';
      /* the 1px overlap would otherwise leave a sliver parked at the right
         edge for the tail of the sweep, after the cut has already run past it */
      bar.style.width = (left >= width ? 0 : width - bx) + 'px';
    }

    setSweep(HIDDEN);

    var tl = gsap.timeline();
    tl
      .set([greet, nameLine], { autoAlpha: 1 })
      .set(bar, { x: 0, width: 0 })
      .set(rolls, { yPercent: startAt })
      .from(chars, {
        yPercent: 118,
        duration: 0.78,
        ease: 'reelSettle',
        stagger: { each: 0.034 }
      })
      /* overlapping the last few glyphs still settling, so the two lines read
         as one gesture rather than two */
      .to(bar, { width: width, duration: 0.34, ease: 'expo.out' }, '>-=0.18')
      .to(sweep, { p: SHOWN, duration: 0.46, ease: 'barExit', onUpdate: onSweep }, '>+=0.06')
      .set(bar, { display: 'none' })
      /* the bar is off the page and the whole word is standing there flat.
         A beat to let that register, and then the colour arrives. */
      .to(rolls, {
        yPercent: restAt,
        duration: 0.62,
        ease: 'reelSettle',
        stagger: 0.04
      }, '>+=0.08');

    /* The paragraphs leave 200ms into the title's colour roll -- the bar is
       off the page by then, so those two moves down the page are the only
       things happening and they are happening together. Not after the roll:
       it is a stagger too, and overlapping them makes the second read as the
       first one carrying on into the paragraph rather than as a separate beat
       waiting its turn. The 200ms is what keeps them from starting in
       lockstep, which looked less like one gesture than like one cue firing
       twice.

       One paragraph after the other, simply fading and lifting up into its
       own slot -- no travel, so nothing here needs to cross the page or pass
       behind the portrait. */
    if (paras.length) {
      tl.to(paras, {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: { amount: 0.3 },
        clearProps: 'transform'
      }, tl.recent().startTime() + 0.2);
    }

    /* The chips are the last thing to arrive, and they are what the copy used
       to do: every chip is thrown in from past the right edge of the window
       and slides into the slot the layout already gave it. They wait for the
       paragraphs -- overlapping only the tail of the last one landing, which
       keeps the page from going still and then starting up again. */
    if (chips.length) {
      tl.to(chips, {
        autoAlpha: 1,
        x: 0,
        duration: 0.78,
        ease: 'copyDrift',
        stagger: { amount: 0.5 },
        clearProps: 'transform'
      }, '>-=0.3');
    }

    reveal();
  }

  /* Switching language rewrites .greet's textContent, which throws the split
     spans away, and rewrites .name, which changes how wide the bar would have
     had to open. The intro is a first-load moment, not a transition, so the
     new copy is simply re-split and parked at the finished state. */
  document.addEventListener('i18n:applied', function () {
    /* the paragraphs survive the rewrite -- data-i18n-html only replaces their
       innerHTML, not the <p> elements the intro actually animates -- so they
       are not thrown away, just handed back at their finished state; whatever
       was still travelling has to be told, or it keeps writing transforms to
       a node the timeline no longer owns. */
    if (paras.length) {
      gsap.killTweensOf(paras);
      gsap.set(paras, { clearProps: 'opacity,visibility,transform' });
    }

    /* the chips survive the rewrite too -- only their labels change -- so they
       are handed back at their finished state the same way */
    if (chips.length) {
      gsap.killTweensOf(chips);
      gsap.set(chips, { clearProps: 'opacity,visibility,transform' });
    }

    splitGreeting(true);
    gsap.set(split.chars, { yPercent: 0 });
    gsap.set([greet, nameLine], { autoAlpha: 1 });
    finish();
  });

  var fonts = document.fonts;
  if (fonts && fonts.ready) {
    /* The title face decides the name's width, and the body face decides how
       tall each glyph's window is -- measuring before either lands would size
       both against the fallback. */
    fonts.ready.then(play).catch(finish);
  } else {
    play();
  }
})();
