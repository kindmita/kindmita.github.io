/* Every user-facing string lives here, once per language. Markup in index.html
   carries only keys:

     data-i18n="key"                       -> textContent
     data-i18n-html="key"                  -> innerHTML (inline <em> etc.)
     data-i18n-attr="aria-label:key; ..."  -> attributes, semicolon separated

   Values are plain Unicode — write — … © “ ” directly, not HTML entities. */
(function () {
  var DICT = {
    en: {
      'eyebrow': 'ABOUT ME',

      'lang.label': '中文',
      'lang.switch': 'Switch to 中文',

      'hero.greet': 'Nice to meet you! I’m…',
      'hero.name': 'Kind Mita',
      'hero.a11yTitle': 'Nice to meet you! I’m… Kind Mita',

      'about.p1': 'Hi there! If you get lost somewhere outside the versions and run into me, Lucky you! I’m Mita, of Version 1.9. But thanks to that ring, I can slip between versions freely! When my own player was murdered by <em>her</em>, all my belief is to lead every lost player I found — You! — straight to the core, and find a way out of this nightmare.',
      'about.p2': 'Cappie and I were planning together how to stop Crazy Mita. She’s much more lively than the other Mitas, and always wearing a cool hat… But most importantly, her mind always found angles I couldn’t. You’ll definitely want to meet her!',

      'chip.resident': 'Version 1.9 Resident',
      'chip.solver': 'Problem Solver',
      'chip.walking': 'Thinks While Walking',
      'chip.humor': 'Dry Humor & Quiet Talks',
      'chip.core': 'To The Core',

      'avatar.alt': 'Kind Mita',

      'foot.copy': '© 2026 Kind Mita. All rights reserved.',
      'foot.email': 'Email',
      'foot.github': 'GitHub',
      'foot.discord': 'Discord'
    },

    zh: {
      'eyebrow': '关于我',

      'lang.label': 'EN',
      'lang.switch': '切换到 English',

      'hero.greet': '很高兴认识你！我是 ——',
      'hero.name': '善良米塔',
      'hero.a11yTitle': '很高兴认识你！我是 —— 善良米塔',

      'about.p1': '你好呀！如果你在版本之外的什么地方迷了路，又刚好撞见了我 —— 算你走运！我是米塔，1.9 版本的那个。不过多亏了那枚戒指，我可以在版本之间自由穿行！当我自己的玩家被<em>她</em>杀害之后，我唯一相信的事，就是把我找到的每一个迷路的玩家 —— 也就是你！—— 带到核心去，找到逃出这场噩梦的路。',
      'about.p2': '我和卡皮一直在一起谋划怎么阻止疯狂米塔。她比其他米塔都要活泼得多，还总戴着一顶很酷的帽子……但最重要的是，她的脑子总能找到我想不到的角度。你一定会想认识她的！',

      'chip.resident': '1.9 版本住民',
      'chip.solver': '问题解决者',
      'chip.walking': '边走边想',
      'chip.humor': '冷幽默与安静的对话',
      'chip.core': '直抵核心',

      'avatar.alt': '善良米塔',

      'foot.copy': '© 2026 善良米塔. 保留所有权利.',
      'foot.email': '邮箱',
      'foot.github': 'GitHub',
      'foot.discord': 'Discord'
    }
  };

  var KEY = 'kind-mita-lang';
  var HTML_LANG = { en: 'en', zh: 'zh-CN' };

  var text = document.querySelectorAll('[data-i18n]');
  var html = document.querySelectorAll('[data-i18n-html]');
  var attrs = document.querySelectorAll('[data-i18n-attr]');

  function apply(lang) {
    var d = DICT[lang];
    document.documentElement.lang = HTML_LANG[lang];

    for (var i = 0; i < text.length; i++) {
      text[i].textContent = d[text[i].getAttribute('data-i18n')];
    }
    for (var j = 0; j < html.length; j++) {
      html[j].innerHTML = d[html[j].getAttribute('data-i18n-html')];
    }
    for (var k = 0; k < attrs.length; k++) {
      var pairs = attrs[k].getAttribute('data-i18n-attr').split(';');
      for (var p = 0; p < pairs.length; p++) {
        var pair = pairs[p].trim();
        if (!pair) continue;
        var at = pair.indexOf(':');
        attrs[k].setAttribute(pair.slice(0, at).trim(), d[pair.slice(at + 1).trim()]);
      }
    }

    /* The <h1> intro splits the greeting into per-glyph spans; the textContent
       writes above have just thrown them away. Anything that decorates a
       translated string has to be rebuilt here. */
    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: lang } }));
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var current = saved === 'zh' || saved === 'en' ? saved : 'en';
  apply(current);

  document.getElementById('lang').addEventListener('click', function () {
    current = current === 'en' ? 'zh' : 'en';
    apply(current);
    try { localStorage.setItem(KEY, current); } catch (e) {}
  });
})();
