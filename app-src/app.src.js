// Siou · سيو — نسخة الموبايل الأولى
// صفحة واحدة: كل شاشة دالة بترجّع HTML، والأزرار بتشتغل بـ data-act.
// البيانات (النجوم والنتايج) متخزّنة على الموبايل بس، مفيش حسابات ولا سيرفر.
(function () {
'use strict';
var E = window.SiouEngine;
var PARTS = /*PARTS*/null;

// ---------- أدوات صغيرة ----------
var DIG = '٠١٢٣٤٥٦٧٨٩';
function ar(n) { return String(n).replace(/[0-9]/g, function (d) { return DIG[d]; }); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function norm(s) {
  s = String(s || ''); if (s.normalize) s = s.normalize('NFKC');   // بيلم الهمزة المفكوكة وحروف «لا» المدموجة
  return s.replace(/[\u200B-\u200F\u061C\uFEFF]/g, '')           // علامات اتجاه مخفية
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')                    // التشكيل والهمزة الفوقية والتطويل
    .replace(/[أإآٱ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '')
    .replace(/[ىی]/g, 'ي').replace(/ک/g, 'ك').replace(/[ةۃ]/g, 'ه')
    .replace(/[،,.؛;:!؟?«»"()]/g, ' ').replace(/\s+/g, ' ').trim();
}
// كلمتين «زي بعض»: نفس الحروف، أو غلطة واحدة في كلمة طويلة (٥ حروف أو أكتر): حرف زيادة أو ناقص أو غلط، أو حرفين جنب بعض متبدلين
function lev1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) { var d = []; for (var k = 0; k < a.length; k++) if (a[k] !== b[k]) d.push(k); if (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]) return true; }   // حرفين جنب بعض متبدلين
  var i = 0, j = 0, miss = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++miss > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return miss + (a.length - i) + (b.length - j) <= 1;
}
function same(a, b) { return a === b || (Math.max(a.length, b.length) >= 5 && lev1(a, b)); }
var STAR_D = 'M0 -1 L0.29 -0.4 L0.95 -0.31 L0.47 0.15 L0.59 0.81 L0 0.5 L-0.59 0.81 L-0.47 0.15 L-0.95 -0.31 L-0.29 -0.4 Z';
function star(size, fill, stroke) { return '<svg width="' + size + '" height="' + size + '" viewBox="-1.2 -1.2 2.4 2.4" aria-hidden="true"><path d="' + STAR_D + '" fill="' + (fill || 'var(--gold)') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="0.08" stroke-linejoin="round"' : '') + '></path></svg>'; }
function lamp(size) { return '<svg viewBox="0 0 120 120" width="' + size + '" height="' + size + '" aria-hidden="true">' + PARTS.lamp + '</svg>'; }
function icon(name, size) {
  return '<svg viewBox="0 0 48 48" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (PARTS.icons[name] || []).map(function (d) { return '<path d="' + d + '"></path>'; }).join('') + '</svg>';
}
function wordmark(w, h, color) { return '<svg role="img" aria-label="ⲤⲒⲞⲨ" viewBox="42 -723 3129 902" width="' + w + '" height="' + h + '" style="display:block;color:' + (color || 'currentColor') + '"><path d="' + PARTS.wordmark + '" fill="currentColor"></path></svg>'; }

// ---------- التخزين على الجهاز ----------
var KEY = 'siou.v1';
var store = { stars: {}, scores: {}, demo: null, installHidden: false };
try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) store = Object.assign(store, saved); } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

// ---------- التاريخ ----------
var DEMO_DATE = [2026, 11, 10];   // ١ هاتور ١٧٤٣: أول يوم في الشهر اللي اتراجع
var picked = null;   // يوم اختاره المستخدم. مش بيتحفظ، فأول ما يفتح التطبيق تاني يرجع للنهارده
store.demo = null;
function todayDate() { var n = new Date(); return [n.getFullYear(), n.getMonth() + 1, n.getDate()]; }
function appDate() { return picked || todayDate(); }
function dayNum(d) { return Math.round(Date.UTC(d[0], d[1] - 1, d[2]) / 864e5); }
function isFuture() { return dayNum(appDate()) > dayNum(todayDate()); }
function shiftDate(d, n) { var t = new Date(Date.UTC(d[0], d[1] - 1, d[2] + n)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function setPicked(d) { picked = d && dayNum(d) !== dayNum(todayDate()) ? d : null; G = null; ui.picker = false; }
function day() {
  var d = appDate(), r = E.readingsFor(d[0], d[1], d[2]);
  r.key = r.coptic.year + '-' + r.coptic.month + '-' + r.coptic.day;
  r.g = d;
  return r;
}
var WEEKDAYS = ['الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
var GMONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function gLabel(r) { return WEEKDAYS[r.weekday] + ' ' + ar(r.g[2]) + ' ' + GMONTHS[r.g[1] - 1] + ' ' + ar(r.g[0]); }
function cLabel(r) { return ar(r.coptic.day) + ' ' + r.coptic.monthName + ' ' + ar(r.coptic.year); }
function inNativityFast(c) { return (c.month === 3 && c.day >= 16) || (c.month === 4 && c.day < 29); }

// ---------- محتوى الأيام ----------
// آية لكل يوم في هاتور (نص فاندايك بالتشكيل). التأمل والسؤال بيظهروا بس لما الخادم يراجعهم (reflectionReviewed).
var VERSES = /*VERSES*/null;
var SLOT_NAME = { LG: 'إنجيل القداس', PA: 'البولس', CA: 'الكاثوليكون', AC: 'الإبركسيس', VG: 'إنجيل العشية', MG: 'إنجيل باكر' };
// الفراغات في المرحلة الأولى: أطول ٤ كلمات مختلفة (٣ لو الآية قصيرة)، بترتيبها في الآية
function bare(w) { return w.replace(/[\u064B-\u0652\u0670]/g, '').replace(/[^\u0621-\u064A]/g, ''); }
function autoGaps(words) {
  var n = words.length < 9 ? 3 : 4, seen = {}, pick = [];
  words.map(function (w, i) { return { i: i, b: bare(w) }; })
    .sort(function (x, y) { return y.b.length - x.b.length || x.i - y.i; })
    .forEach(function (o) { if (pick.length < n && o.b.length > 2 && !seen[o.b]) { seen[o.b] = 1; pick.push(o.i); } });
  return pick.sort(function (x, y) { return x - y; });
}
var CONTENT = {};
Object.keys(VERSES.days).forEach(function (d) {
  var v = VERSES.days[d], words = v.text.split(' '), ok = !!v.reflectionReviewed;
  CONTENT[VERSES.year + '-' + VERSES.month + '-' + d] = {
    verse: { ref: v.ref, words: words, gaps: v.gaps || autoGaps(words) }, from: SLOT_NAME[v.from] || '',
    theme: ok ? v.title : null, reflection: ok ? v.reflection : null, question: ok ? v.question : null
  };
});
// يوم ٦ هاتور: اليوم الكامل الأول (فاتحة الإنجيل، والخطوات، والسنكسار)
// السنكسار: عناوين تذكارات كل يوم من فهرس موقع الأنبا تكلا
var SYNAX = /*SYNAX*/null;
Object.keys(SYNAX.days).forEach(function (d) { var c = CONTENT['1743-' + SYNAX.month + '-' + d]; if (c) c.synaxarium = SYNAX.days[d]; });
// مزامير «حاسس بإيه» (فاندايك بالتشكيل)
var PSALMS = /*PSALMS*/null;
var C6 = CONTENT['1743-3-6'];
C6.gospel = 'لو ٨: ٤–١٥';
C6.opening = 'قفوا بخوف أمام الله، وانصتوا لسماع الإنجيل المقدس. فصل شريف من بشارة معلمنا لوقا الإنجيلي. بركته تكون مع جميعنا، آمين.';
C6.verse.gaps = [6, 8, 11, 13];
C6.steps = ['تسمع', 'تحفظ', 'تثمر'];
C6.synaxarium = ['تذكار تكريس كنيسة السيدة العذراء بدير المحرق بجبل قسقام', 'نياحة القديس فيلكس بابا روما'];

// ---------- الصور وصورة كل مناسبة ----------
var IMAGES = {
  'virgin-tapestry': { focus: '50% 44%', title: 'أيقونة العذراء والطفل', meta: 'نسيج صوف · مصر، القرن السادس', body: 'العذراء قاعدة على عرش وشايلة المسيح، وجنبها ملاكين. مكتوب فوقهم باليوناني: القديس ميخائيل، القديسة مريم، القديس غبريال. وحوالين الأيقونة إطار فيه وشوش الاتناشر رسول، كل واحد باسمه. طولها حوالي ١٧٩ سم.', source: 'متحف كليفلاند للفنون، رقم ١٩٦٧.١٤٤ · ملكية عامة' },
  'mena': { focus: '50% 16%', title: 'أيقونة المسيح والأنبا مينا', meta: 'رسم بالشمع على خشب · دير باويط، النص التاني من القرن السادس', body: 'المسيح شايل الإنجيل وحاطط إيده على كتف الأنبا مينا، رئيس دير الأنبا أبوللو في باويط. ده مش مارمينا العجايبي الشهيد. مكتوب فوق المسيح «المخلّص»، وفوق الأنبا مينا «أبا مينا الرئيس». موجودة دلوقتي في متحف اللوفر.', source: 'متحف اللوفر، رقم E11565 · الصورة ملكية عامة على ويكيميديا' },
  'codex-cross': { focus: '50% 42%', title: 'صليب من مخطوط ليتورجي قبطي', meta: 'حبر أسود وملوّن على ورق من فينيسيا · القرن ١٧–١٨', body: 'كتاب صلوات صغير، طوله حوالي ١٥ سم، يعني كان بيتشال في الإيد. الصفحة دي فيها صليب كبير مزخرف، والصفحة اللي جنبه مزوّقة بنفس الحبر.', source: 'متحف المتروبوليتان، رقم ١٩.١٩٦.٥ · ملكية عامة' },
  'saint-ostracon': { focus: '30% 52%', title: 'رسم قديس قبطي', meta: 'حجر جيري ملوّن · البر الغربي بالأقصر، القرن ٦–٧', body: 'رسم بسيط لوش قديس، اتلقى على حيطة مقبرة مصرية قديمة في الدير البحري. في القرون دي سكن رهبان ونسّاك في مقابر كتير في البر الغربي.', source: 'متحف المتروبوليتان، رقم ٢٣.٣.٧٦١ · ملكية عامة' },
  'three-saints': { focus: '50% 30%', title: 'نسيج عليه تلات قديسين', meta: 'قطن متطرّز بخيط دهب وحرير · مصر، القرن ١٢', body: 'تلات قديسين واقفين تحت تلات عقود، متطرزين بخيوط ملفوفة بالدهب. المتحف ما ذكرش أساميهم.', source: 'متحف المتروبوليتان، رقم ٢٩.١٠٦ · ملكية عامة' },
  'lamp': { focus: '50% 50%', title: 'سراج من فخار', meta: 'فخار معمول بقالب · مصر، القرن ٥–٦', body: 'سراج زيت صغير، عرضه ١١ سم. كان بيتحط فيه زيت وفتيلة وينوّر. ومن هنا جه اسم «سراج».', source: 'متحف المتروبوليتان، رقم ٢٧.٩٤.٢٤ · ملكية عامة' }
};
// أول مناسبة تنطبق بتكسب (نفس جدول img/occasions.json)
function occasion(r) {
  var c = r.coptic, sun = r.weekday === 0;
  var sundayN = Math.floor((c.day - 1) / 7) + 1;
  var ORD = ['الأول', 'التاني', 'التالت', 'الرابع', 'الخامس'];
  if (c.month === 3 && c.day === 6) return { img: 'virgin-tapestry', line: 'تذكار تكريس كنيسة العذراء بالمحرق', why: 'النهارده تذكار تكريس كنيسة السيدة العذراء بدير المحرق.' };
  if (c.day === 21) return { img: 'virgin-tapestry', line: 'تذكار السيدة العذراء', why: 'يوم ٢١ من كل شهر قبطي تذكار للسيدة العذراء.' };
  if (c.month === 3 && c.day === 12) return { img: null, line: 'عيد رئيس الملائكة ميخائيل', why: '' };
  if (c.month === 3 && c.day === 15) return { img: 'saint-ostracon', line: 'استشهاد مارمينا العجايبي', why: 'النهارده تذكار قديس، والصورة دي لقديس قبطي من نفس الزمن تقريبًا، مش لمارمينا نفسه.' };
  if (inNativityFast(c)) return { img: 'codex-cross', line: sun ? 'الأحد ' + ORD[sundayN - 1] + ' من ' + c.monthName : 'صوم الميلاد', why: 'إحنا في صوم الميلاد، فالصورة صليب.' };
  if (sun) return { img: 'mena', line: 'الأحد ' + ORD[sundayN - 1] + ' من ' + c.monthName, why: 'النهارده الأحد، يوم الرب، فالصورة أيقونة المسيح.' };
  return { img: 'lamp', line: '', why: 'يوم عادي. السراج هو رمز سراج.' };
}

// ---------- الراوتر ----------
var route = (location.hash || '#home').slice(1);
var ui = { info: false, story: null, storyBlob: null, picker: false };
window.addEventListener('hashchange', function () { if (rec) stopMic(); route = (location.hash || '#home').slice(1); ui.info = false; render(); window.scrollTo(0, 0); });
function go(r) { if (('#' + r) === location.hash) render(); else location.hash = r; }
var app = document.getElementById('app');
function toast(msg) {
  var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
}

// ---------- أجزاء مشتركة ----------
function header(title, sub, opts) {
  opts = opts || {};
  return '<header class="hdr' + (opts.cls ? ' ' + opts.cls : '') + '"><span class="pat"></span>' +
    '<button class="ring" data-act="nav" data-to="home" aria-label="سراج · الرئيسية" style="width:40px;height:40px">' + lamp(40) + '</button>' +
    '<div style="position:relative;display:flex;flex-direction:column;flex:1;min-width:0"><span class="hdr-title">' + title + '</span>' + (sub ? '<span class="hdr-sub">' + sub + '</span>' : '') + '</div>' +
    (opts.end || '') + '</header>';
}
function nav(cur) {
  var items = [['home', 'النهارده', icon('siraj-lamp', 22)], ['verses', 'آياتي', icon('quill', 22)], ['feeling', 'حاسس بإيه', icon('candle', 22)], ['sky', 'السما', star(22, 'none', 'currentColor').replace('fill="none"', 'fill="none" stroke-width="0.12"')]];
  return '<nav class="nav" aria-label="التنقل" style="grid-template-columns:repeat(4,1fr)">' + items.map(function (it) {
    return '<button data-act="nav" data-to="' + it[0] + '"' + (cur === it[0] ? ' aria-current="page"' : '') + '><span class="ic">' + it[2] + '</span>' + it[1] + '</button>';
  }).join('') + '</nav>';
}
function monthStars(r) {
  var n = 0; for (var d = 1; d <= 30; d++) if (store.stars[r.coptic.year + '-' + r.coptic.month + '-' + d]) n++; return n;
}
// «وأنا؟»: سؤال التأمل في محراب بقوس وهالة دهبي، عشان يبقى أوضح حاجة بعد التأمل
function andMe(q) {
  return '<section aria-label="وأنا؟" style="position:relative;margin-top:8px;padding:30px 22px 24px;border-radius:140px 140px 18px 18px;background:var(--cinnabar);color:var(--on-lapis);text-align:center;box-shadow:0 0 0 2px var(--ink),0 0 0 5px var(--cinnabar),0 0 0 7px var(--gold);display:flex;flex-direction:column;align-items:center;gap:10px">' +
    '<span style="width:48px;height:48px;border-radius:999px;background:var(--gold-soft);box-shadow:inset 0 0 0 2px var(--gold),0 0 0 1.5px var(--ink);display:flex;align-items:center;justify-content:center;color:var(--ink)">' + icon('candle', 26) + '</span>' +
    '<h2 style="margin:0;color:var(--gold-soft);font-size:28px;line-height:38px">وأنا؟</h2>' +
    '<p style="margin:0;font-size:18px;line-height:30px;font-weight:600">' + q + '</p>' +
    '<span style="font-size:13px;opacity:.85">خد دقيقة وفكّر فيها، أو اكتبها في نوتة.</span></section>';
}
function chev(dir) { return '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (dir > 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>'; }
// على الرئيسية الشريط ظاهر دايمًا، وفي باقي الشاشات بيظهر بس لو فيه يوم متختار
function demoBar(r, always) {
  if (!picked && !always) return '';
  var arrow = 'width:44px;height:44px;padding:0;justify-content:center;flex-shrink:0';
  return '<div style="display:flex;align-items:center;gap:8px">' +
    '<button class="pill" data-act="dayShift" data-n="-1" aria-label="اليوم اللي قبله" style="' + arrow + '">' + chev(-1) + '</button>' +
    '<button class="pill' + (picked ? ' on' : '') + '" data-act="pickOpen" aria-haspopup="dialog" style="flex:1;justify-content:center;min-height:44px">' + icon('calendar', 18) + (picked ? gLabel(r) : 'اختار يوم') + '</button>' +
    '<button class="pill" data-act="dayShift" data-n="1" aria-label="اليوم اللي بعده" style="' + arrow + '">' + chev(1) + '</button></div>' +
    (picked ? '<div class="note" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 8px 8px 16px"><span>بتشوف ' + cLabel(r) + (isFuture() ? '. ده يوم جاي، فالنجمة مش هتنوّر غير في يومها.' : '') + '</span><button class="pill" data-act="real" style="flex-shrink:0">ارجع للنهارده</button></div>' : '');
}
function pickerSheet() {
  if (!ui.picker) return '';
  var d = appDate(), v = d[0] + '-' + pad(d[1]) + '-' + pad(d[2]);
  return '<div class="sheet-wrap" data-act="pickClose"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="pick-t" data-stop="1">' +
    '<span class="grab" aria-hidden="true"></span><h2 id="pick-t">اختار يوم</h2>' +
    '<p class="muted" style="margin:0;font-size:14px;line-height:22px">هتشوف قراءات اليوم ده وآيته وسنكساره. القطمارس المراجَع لحد دلوقتي هو شهر هاتور (١٠ نوفمبر – ٩ ديسمبر).</p>' +
    '<input id="pick-date" type="date" value="' + v + '" aria-label="التاريخ" style="width:100%;min-height:52px;border:none;border-radius:12px;padding:0 14px;background:var(--page);box-shadow:inset 0 0 0 2px var(--rule);font:inherit;font-size:17px;color:var(--ink)">' +
    '<button class="btn" data-act="pickGo">روح لليوم ده</button>' +
    (picked ? '<button class="btn" data-act="real" style="background:none;color:var(--lapis)">ارجع للنهارده</button>' : '') + '</section></div>';
}
function infoSheet(r) {
  var o = occasion(r); if (!ui.info || !o.img) return '';
  var I = IMAGES[o.img];
  return '<div class="sheet-wrap" data-act="closeInfo"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="info-t" data-stop="1">' +
    '<span class="grab" aria-hidden="true"></span>' +
    '<div style="display:flex;gap:14px;align-items:center"><img src="img/' + o.img + '.jpg" alt="" style="width:72px;height:88px;object-fit:cover;object-position:' + I.focus + ';border-radius:999px 999px 8px 8px;box-shadow:0 0 0 1.5px var(--ink),0 0 0 4px var(--page-raised),0 0 0 5.5px var(--gold);flex-shrink:0">' +
    '<div><h2 id="info-t" style="font-size:20px">' + I.title + '</h2><p class="muted" style="margin:0;font-size:13px;line-height:20px">' + I.meta + '</p></div></div>' +
    '<p style="margin:0;font-size:15px;line-height:26px">' + I.body + '</p>' +
    (o.why ? '<p class="note" style="margin:0"><b style="font-family:var(--display)">ليه النهارده؟ </b>' + o.why + '</p>' : '') +
    '<p class="muted" style="margin:0;font-size:12px;line-height:18px">' + I.source + '</p>' +
    '<button class="btn" data-act="closeInfo">تمام</button></section></div>';
}
function seasonCard(r) {
  var o = occasion(r);
  var pic = o.img
    ? '<img src="img/' + o.img + '.jpg" alt="' + esc(IMAGES[o.img].title) + '" style="object-position:' + IMAGES[o.img].focus + '"><button class="info-chip" data-act="info" aria-haspopup="dialog"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg>عن الصورة</button>'
    : '<div class="pic-fallback">' + lamp(120) + '</div>';
  var season = r.season !== 'annual' ? 'زمن الكنيسة' : inNativityFast(r.coptic) ? 'صوم الميلاد' : 'زمن الكنيسة · القطمارس السنوي';
  return '<section class="season"><div class="pic">' + pic + '</div><div style="display:flex;flex-direction:column;gap:2px;padding:0 8px">' +
    '<p style="margin:0;font-size:12px;line-height:16px;letter-spacing:.04em;opacity:.85">' + season + '</p>' +
    '<div class="row" style="align-items:baseline"><p style="margin:0;font-family:var(--display);font-size:28px;line-height:40px;font-weight:700">' + cLabel(r) + '</p><p style="margin:0;font-size:13px">' + gLabel(r).split(' ').slice(1).join(' ') + '</p></div>' +
    (o.line ? '<p style="margin:2px 0 0;font-size:13px;line-height:18px;opacity:.85">' + o.line + '</p>' : '') + '</div></section>';
}

// ---------- الشاشة الرئيسية ----------
// كارت «احفظ آية النهارده»: أهم حاجة في الرئيسية
function levelPips(key, onDark) {
  var out = '';
  for (var i = 1; i <= 4; i++) {
    var done = store.scores[key + ':' + i] !== undefined;
    out += '<span title="المرحلة ' + ar(i) + '" style="width:26px;height:30px;border-radius:999px 999px 4px 4px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;' +
      (done ? 'background:var(--gold);color:var(--ink);box-shadow:0 0 0 1.5px var(--ink)' : onDark ? 'box-shadow:inset 0 0 0 1.5px rgba(255,250,240,.45);color:rgba(255,250,240,.7)' : 'box-shadow:inset 0 0 0 1.5px var(--rule);color:var(--ink-muted)') + '">' + ar(i) + '</span>';
  }
  return '<span style="display:inline-flex;gap:4px" aria-label="المراحل اللي خلصتها">' + out + '</span>';
}
function memorizeCard(r, C) {
  var lit = !!store.stars[r.key], u = unlocked(), all4 = store.scores[r.key + ':4'] !== undefined;
  var cta = all4 ? '<button class="btn" data-act="nav" data-to="verses" style="background:var(--gold);color:var(--ink)">' + star(20, 'var(--on-lapis)', 'var(--ink)') + 'حفظتها كاملة. شوف آياتك</button>'
    : '<button class="btn" data-act="game" style="background:var(--gold);color:var(--ink);font-size:18px;min-height:56px">' + star(22, 'var(--on-lapis)', 'var(--ink)') +
      (isFuture() ? 'اتمرّن على الآية' : lit ? 'كمّل التحدي: المرحلة ' + ar(u) : store.scores[r.key + ':1'] !== undefined ? 'كمّل: المرحلة ' + ar(u) : 'يلا نحفظها') + '</button>';
  return '<section aria-labelledby="mem-t" style="background:var(--lapis);color:var(--on-lapis);border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 0 0 2px var(--ink),0 0 0 4px var(--gold)">' +
    '<div class="row"><h2 id="mem-t" style="color:var(--gold-soft)">احفظ آية النهارده</h2>' + levelPips(r.key, true) + '</div>' +
    '<p class="verse" style="color:var(--on-lapis)">' + C.verse.words.join(' ') + '</p>' +
    '<div class="row" style="flex-wrap:wrap;gap:8px"><span class="ref" style="color:var(--ink)">' + C.verse.ref + ' · فاندايك</span>' + (C.from ? '<span style="font-size:13px;opacity:.8">من ' + C.from + '</span>' : '') + '</div>' +
    cta + (lit && !all4 ? '<p style="margin:-4px 0 0;font-size:13px;opacity:.85;text-align:center">' + star(14) + ' نجمة النهارده نوّرت.</p>' : '') +
    '<button data-act="nav" data-to="readings" style="align-self:center;background:none;border:none;color:var(--gold-soft);font-weight:600;font-size:14px;min-height:44px;cursor:pointer;padding:0">' + (C.reflection ? 'اقرا التأمل و«وأنا؟» ←' : 'كل قراءات اليوم ←') + '</button></section>';
}
// كارت «حاسس بإيه؟»: الحاجة التانية المميزة
function feelingCard() {
  return '<button data-act="nav" data-to="feeling" style="border:none;cursor:pointer;text-align:start;background:var(--page-raised);color:var(--ink);border-radius:22px;padding:14px 16px 14px 14px;display:flex;align-items:center;gap:14px;box-shadow:inset 0 0 0 2px var(--ink)">' +
    '<span style="flex-shrink:0;width:72px;height:84px;border-radius:999px 999px 12px 12px;overflow:hidden;background:' + MOODS[5].bg + ';box-shadow:0 0 0 2px var(--gold)"><svg viewBox="0 0 390 440" preserveAspectRatio="xMidYMax slice" width="72" height="84" aria-hidden="true">' + PARTS.flames[5] + '</svg></span>' +
    '<span style="display:flex;flex-direction:column;gap:4px;flex:1"><b style="font-family:var(--display);font-size:20px;line-height:28px;color:var(--lapis)">حاسس بإيه النهارده؟</b><span class="muted" style="font-size:14px;line-height:22px">حرّك الشعلة لحد ما تبقى شبهك، ونقرالك مزمور يناسبك.</span></span>' +
    '<span aria-hidden="true" style="font-size:22px;color:var(--lapis)">←</span></button>';
}
// كل الآيات اللي حفظها (نجمتها نوّرت)، الأحدث الأول
function memorized() {
  return Object.keys(store.stars).filter(function (k) { return store.stars[k] && CONTENT[k]; }).map(function (k) {
    var p = k.split('-').map(Number); return { key: k, y: p[0], m: p[1], d: p[2], jdn: E.copticToJdn(p[0], p[1], p[2]) };
  }).sort(function (a, b) { return b.jdn - a.jdn; });
}
function screenVerses() {
  var list = memorized(), mastered = list.filter(function (v) { return store.scores[v.key + ':4'] !== undefined; }).length;
  var r = day(), withVerse = 0; for (var d = 1; d <= 30; d++) if (CONTENT[r.coptic.year + '-' + r.coptic.month + '-' + d]) withVerse++;
  var mN = monthStars(r), pct = withVerse ? Math.round(100 * mN / withVerse) : 0;
  var h = '<div class="screen">' + header('آياتي', 'الآيات اللي حفظتها') + '<main>' +
    '<section class="card" style="display:flex;flex-direction:column;gap:14px">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center">' +
    '<div><b style="display:block;font-family:var(--display);font-size:40px;line-height:50px;color:var(--lapis)">' + ar(list.length) + '</b><span class="muted" style="font-size:14px">آية حفظتها</span></div>' +
    '<div><b style="display:block;font-family:var(--display);font-size:40px;line-height:50px;color:var(--cinnabar)">' + ar(mastered) + '</b><span class="muted" style="font-size:14px">خلصت مراحلها الأربعة</span></div></div>' +
    '<div><div class="row" style="font-size:13px"><span>' + r.coptic.monthName + '</span><span class="muted">' + ar(mN) + ' من ' + ar(withVerse) + '</span></div>' +
    '<div style="height:12px;border-radius:999px;background:var(--papyrus);overflow:hidden;margin-top:6px"><div style="height:100%;width:' + pct + '%;background:var(--gold);border-radius:999px"></div></div></div></section>';
  if (!list.length) {
    var C = CONTENT[r.key];
    h += '<div class="card-soft" style="display:flex;flex-direction:column;gap:12px;text-align:center;align-items:center"><span class="halo" style="width:64px;height:64px;border-radius:999px;background:var(--gold-soft);box-shadow:inset 0 0 0 2px var(--gold),0 0 0 1px var(--ink);display:flex;align-items:center;justify-content:center">' + icon('quill', 30) + '</span>' +
      '<h2>لسه مافيش آيات هنا</h2><p style="margin:0;line-height:26px">كل آية بتخلص المرحلة التانية بتاعتها بتتحفظ هنا، ونجمتها بتنوّر في سماك.</p>' +
      (C ? '<button class="btn" data-act="game" style="align-self:stretch">احفظ آية النهارده</button>' : '') + '</div>';
  } else {
    h += '<h2>آياتك</h2>' + list.map(function (v) {
      var C = CONTENT[v.key];
      return '<article class="card-soft" style="display:flex;flex-direction:column;gap:10px">' +
        '<div class="row"><span class="muted" style="font-size:13px">' + ar(v.d) + ' ' + E.COPTIC_MONTHS[v.m - 1] + '</span>' + levelPips(v.key, false) + '</div>' +
        '<p class="verse" style="font-size:19px;line-height:34px">' + C.verse.words.join(' ') + '</p>' +
        '<div class="row"><span class="ref">' + C.verse.ref + '</span><button class="pill" data-act="review" data-k="' + v.key + '">راجعها</button></div></article>';
    }).join('');
  }
  return h + '</main>' + nav('verses') + '</div>';
}
// قراية المزمور كامل
function screenPsalm() {
  var id = feel.ps || MOODS[feel.mood].p, P = PSALMS.psalms[id];
  var h = '<div class="screen">' + header('مز ' + ar(id), P.title + (P.agpeya !== ar(id) ? ' · رقمه ' + P.agpeya + ' في الأجبية' : '')) + '<main style="gap:16px">' +
    '<p class="muted" style="margin:0;font-size:14px;line-height:22px">' + MOODS[feel.mood].label + '؟ اقرا المزمور ده على مهلك، وخلّيه صلاتك.</p>' +
    '<article class="card" style="display:flex;flex-direction:column;gap:6px">' + P.verses.map(function (v, i) {
      return '<p style="margin:0;font-family:var(--scripture);font-size:21px;line-height:40px"><sup style="font-family:var(--display);font-size:12px;color:var(--gold);margin-inline-end:4px">' + ar(i + 1) + '</sup>' + v + '</p>';
    }).join('') + '<span class="ref" style="align-self:flex-start;margin-top:8px">مز ' + ar(id) + ' · فاندايك</span></article>' +
    '<button class="btn" data-act="nav" data-to="feeling">ارجع لـ«حاسس بإيه»</button>' +
    '<p class="note" style="margin:0">لو محتاج تتكلم، كلّم أب اعترافك أو خادمك.</p></main>' + nav('feeling') + '</div>';
  return h;
}
function screenHome() {
  var r = day(), C = CONTENT[r.key], lit = !!store.stars[r.key];
  var hdr = '<header class="hdr" style="justify-content:space-between"><span class="pat"></span>' +
    '<button class="ring" data-act="nav" data-to="home" aria-label="ⲤⲒⲞⲨ · الرئيسية" style="box-shadow:none;gap:12px;color:var(--on-lapis)"><span class="ring" style="width:46px;height:46px">' + lamp(46) + '</span>' +
    '<span dir="ltr" style="display:flex;flex-direction:column;align-items:flex-start;gap:6px">' + wordmark(104, 30) +
    '<span style="font-family:Marcellus,Georgia,serif;font-size:11.5px;line-height:14px;letter-spacing:.18em;opacity:.85">SIOU · <span style="font-family:var(--body);letter-spacing:0">نجمة</span></span></span></button>' +
    '<button data-act="nav" data-to="sky" aria-label="' + ar(monthStars(r)) + ' نجوم في ' + r.coptic.monthName + '" style="position:relative;background:none;border:none;color:var(--on-lapis);min-height:44px;display:inline-flex;align-items:center;gap:6px;font-family:var(--display);font-size:18px;font-weight:700;cursor:pointer">' + star(18) + ar(monthStars(r)) + '</button></header>';
  var h = '<div class="screen">' + hdr + '<main>' + seasonCard(r) + demoBar(r, true);
  if (r.status === 'missing') {
    h += '<div class="card-soft" style="display:flex;flex-direction:column;gap:12px"><h2>قراءات ' + r.coptic.monthName + ' لسه بتتجهز</h2>' +
      '<p style="margin:0;font-size:15px;line-height:26px">القطمارس اللي اتراجع لحد دلوقتي هو شهر هاتور، وبيبدأ الاتنين ١٠ نوفمبر. لحد ما ييجي، جرّب يوم كامل من هاتور.</p>' +
      '<button class="btn" data-act="demo">روح لأول يوم في هاتور</button></div>' + feelingCard();
  } else if (C) {
    h += memorizeCard(r, C) + feelingCard();
  } else {
    h += '<section style="display:flex;flex-direction:column;gap:12px"><h2>قراءات النهارده</h2><div class="card-soft" style="display:flex;flex-direction:column;gap:10px">' +
      '<p style="margin:0">إنجيل القداس: <b>' + r.display.LG.join('، ') + '</b></p>' +
      '<p class="muted" style="margin:0;font-size:14px;line-height:22px">آية اليوم والتأمل لسه بيتكتبوا للأيام دي. القراءات نفسها جاهزة.</p>' +
      '<button class="btn" data-act="nav" data-to="readings">كل قراءات اليوم</button></div></section>' + feelingCard();
  }
  // النجمة والأسبوع
  var dots = '';
  for (var i = 0; i < 7; i++) {
    var off = i - r.weekday, jdn = E.copticToJdn(r.coptic.year, r.coptic.month, r.coptic.day) + off, c = E.jdnToCoptic(jdn);
    var k = c.year + '-' + c.month + '-' + c.day, on = !!store.stars[k], isToday = off === 0, future = off > 0;
    var dotStyle = on ? 'background:var(--gold);box-shadow:0 0 0 1.5px var(--ink)' : isToday ? 'border:2px dashed var(--lapis);background:var(--gold-soft)' : future ? 'background:var(--page)' : 'box-shadow:inset 0 0 0 1.5px var(--rule)';
    dots += '<div><span class="dot" style="' + dotStyle + '"></span>' + (isToday ? '<b style="color:var(--lapis)">النهارده</b>' : WEEKDAYS[i]) + '</div>';
  }
  h += '<section class="card-soft" style="display:flex;flex-direction:column;gap:16px"><div class="row"><h2>نجمتك</h2><span class="muted" style="font-size:13px"><b style="font-family:var(--display);font-size:18px;color:var(--ink)">' + ar(monthStars(r)) + '</b> نجوم في ' + r.coptic.monthName + '</span></div>' +
    '<div class="week">' + dots + '</div>' +
    '<button class="btn" data-act="nav" data-to="verses" style="background:var(--gold-soft);color:var(--ink);box-shadow:inset 0 0 0 2px var(--gold)">' + icon('quill', 20) + 'آياتي المحفوظة<span style="min-width:30px;height:30px;padding:0 8px;border-radius:999px;background:var(--lapis);color:var(--on-lapis);display:inline-flex;align-items:center;justify-content:center;font-size:16px">' + ar(memorized().length) + '</span></button></section>';
  // المكتبة
  var tiles = [['readings', 'القطمارس', icon('calendar', 28)], ['agpeya', 'الأجبية', icon('prayer-book', 28)], ['saint', 'السنكسار', icon('saint', 28)],
    ['bible', 'الكتاب المقدس', icon('chi-rho', 28)], ['verses', 'آياتي', icon('quill', 28)], ['sky', 'السما', star(28, 'var(--gold)', 'var(--ink)')]];
  h += '<section style="display:flex;flex-direction:column;gap:12px"><h2>المكتبة</h2><div class="tiles">' + tiles.map(function (t) {
    return '<button class="tile" data-act="' + (t[0] === 'bible' ? 'soon' : 'nav') + '" data-to="' + t[0] + '"><span class="arch"' + (t[0] === 'sky' ? ' style="background:var(--lapis);box-shadow:inset 0 0 0 1.5px var(--ink)"' : '') + '><span class="halo">' + t[2] + '</span></span>' + t[1] + '</button>';
  }).join('') + '</div></section>';
  if (!store.installHidden) h += '<div class="note" style="display:flex;flex-direction:column;gap:8px"><b style="font-family:var(--display)">ثبّت سيو على موبايلك</b><span>من قايمة المتصفح اختار «إضافة إلى الشاشة الرئيسية»، وهيبقى ليه أيقونة زي أي تطبيق.</span><button class="pill" data-act="hideInstall" style="align-self:flex-start">تمام</button></div>';
  h += '</main>' + nav('home') + infoSheet(r) + pickerSheet() + '</div>';
  return h;
}

// ---------- القراءات ----------
function screenReadings() {
  var r = day(), C = CONTENT[r.key];
  var h = '<div class="screen">' + header('قراءات اليوم', r.status !== 'missing' && r.weekday === 0 ? r.title + ' · ' + cLabel(r) : cLabel(r)) + '<main>' + demoBar(r);
  if (r.status === 'missing') return h + '<div class="card-soft"><h2>قراءات ' + r.coptic.monthName + ' لسه بتتجهز</h2><p>جرّب يوم من هاتور لحد ما الشهر ده يتراجع.</p><button class="btn" data-act="demo">روح لأول يوم في هاتور</button></div></main>' + nav('') + '</div>';
  if (C && C.reflection) {
    h += '<section style="text-align:center;display:flex;flex-direction:column;gap:4px"><h1 style="margin:0;font-family:var(--display);font-size:32px;line-height:46px;color:var(--lapis)">' + C.theme + '</h1>' + (C.gospel ? '<p class="muted" style="margin:0;font-size:14px">إنجيل القداس · ' + C.gospel + '</p>' : C.from ? '<p class="muted" style="margin:0;font-size:14px">من ' + C.from + '</p>' : '') + '</section>' +
      '<section style="display:flex;flex-direction:column;gap:12px">' + (C.opening ? '<p class="muted" style="margin:0;font-size:14px;line-height:24px;text-align:center">' + C.opening + '</p>' : '') +
      '<article class="card"><p class="verse">' + C.verse.words.join(' ') + '</p><span class="ref">' + C.verse.ref + ' · فاندايك</span></article></section>' +
      '<section style="display:flex;flex-direction:column;gap:12px"><h2>التأمل</h2><p style="margin:0;line-height:28px">' + C.reflection + '</p>' +
      (C.steps ? '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' + C.steps.map(function (s, i) {
        return '<div style="background:var(--page-raised);border-radius:999px 999px 12px 12px;box-shadow:inset 0 0 0 1.5px var(--rule);padding:20px 4px 14px;display:flex;flex-direction:column;align-items:center;gap:6px"><span style="width:36px;height:36px;border-radius:999px;background:var(--ochre-soft);box-shadow:inset 0 0 0 2px var(--ochre);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700">' + ar(i + 1) + '</span><b>' + s + '</b></div>';
      }).join('') + '</div>' : '') + '</section>' + andMe(C.question);
  } else if (C) {
    h += '<section style="display:flex;flex-direction:column;gap:12px"><h2>آية اليوم</h2>' +
      '<article class="card" style="display:flex;flex-direction:column;gap:12px"><p class="verse">' + C.verse.words.join(' ') + '</p><span class="ref" style="align-self:flex-start">' + C.verse.ref + ' · فاندايك</span>' +
      (C.from ? '<p class="muted" style="margin:0;font-size:13px;line-height:20px">من ' + C.from + ' النهارده</p>' : '') + '</article>' +
      '<p class="muted" style="margin:0;font-size:13px;line-height:20px">تأمل اليوم ده لسه عند المراجعة، وهيظهر هنا أول ما يتراجع.</p></section>';
  }
  var groups = [['العشية', [['VP', 'المزمور'], ['VG', 'الإنجيل']]], ['باكر', [['MP', 'المزمور'], ['MG', 'الإنجيل']]], ['القداس', [['PA', 'البولس'], ['CA', 'الكاثوليكون'], ['AC', 'الإبركسيس'], ['LP', 'المزمور'], ['LG', 'الإنجيل']]]];
  h += groups.map(function (g) {
    return '<section style="display:flex;flex-direction:column;gap:8px"><h2>' + g[0] + '</h2><div class="list">' + g[1].map(function (s) {
      return '<div><b style="font-weight:600">' + s[1] + '</b><span class="muted" style="font-size:14px;text-align:left">' + r.display[s[0]].join('<br>') + '</span></div>';
    }).join('') + '</div></section>';
  }).join('');
  h += '<p class="muted" style="margin:0;font-size:12px;text-align:center">الشواهد من قطمارس موقع الأنبا تكلا، بعد مراجعة خادم. المزامير بترقيم فاندايك، ورقم القطمارس المطبوع جنبها.</p>';
  if (C) h += '<button class="btn" data-act="game">' + star(20, 'var(--gold)', 'var(--on-lapis)') + 'يلا نحفظ الآية</button>';
  return h + '</main>' + nav('') + '</div>';
}

// ---------- السنكسار ----------
function screenSaint() {
  var r = day(), C = CONTENT[r.key], o = occasion(r);
  var pic = o.img ? '<div style="position:relative;align-self:center"><img src="img/' + o.img + '.jpg" alt="' + esc(IMAGES[o.img].title) + '" style="display:block;width:240px;height:300px;object-fit:cover;object-position:' + IMAGES[o.img].focus + ';border-radius:999px 999px 12px 12px;box-shadow:0 0 0 2px var(--ink),0 0 0 6px var(--page),0 0 0 8px var(--gold)"><button class="info-chip" data-act="info" style="left:50%;bottom:-14px;transform:translateX(-50%)">عن الصورة</button></div>' : '';
  var h = '<div class="screen">' + header('السنكسار', cLabel(r)) + '<main>' + demoBar(r) + pic + '<h1 style="margin:8px 0 0;font-family:var(--display);font-size:24px;color:var(--lapis);text-align:center">تذكارات النهارده</h1>';
  if (C && C.synaxarium) h += C.synaxarium.map(function (s, i) { return '<article class="' + (i ? 'card-soft' : 'card') + '" style="display:flex;flex-direction:column;gap:6px"><span class="muted" style="font-size:13px">' + ar(i + 1) + '</span><b style="font-family:var(--display);font-size:18px;line-height:28px">' + s + '</b></article>'; }).join('') +
    (r.coptic.month === 3 ? '<a class="btn" href="https://st-takla.org/Full-Free-Coptic-Books/Synaxarium-or-Synaxarion/03-Hatoor/' + pad(r.coptic.day) + '-Hatoor.html" target="_blank" rel="noopener" style="background:var(--gold-soft);color:var(--ink)">اقرا السير كاملة على موقع الأنبا تكلا</a>' : '') +
    '<p class="muted" style="margin:0;font-size:12px;text-align:center">العناوين من سنكسار موقع الأنبا تكلا.</p>';
  else h += '<div class="card-soft"><p style="margin:0">سنكسار اليوم ده لسه بيتجهز.' + (o.line ? ' النهارده: <b>' + o.line + '</b>.' : '') + '</p></div>';
  return h + '</main>' + nav('') + infoSheet(r) + '</div>';
}

// ---------- الأجبية ----------
var HOURS = [['باكر', 'قيامة المسيح', 'الصبح بدري'], ['الساعة التالتة', 'حلول الروح القدس، ومحاكمة المسيح', '٩ الصبح'], ['الساعة السادسة', 'صلب المسيح', '١٢ الضهر'], ['الساعة التاسعة', 'موت المسيح بالجسد على الصليب', '٣ العصر'], ['الغروب', 'إنزال جسد المسيح من على الصليب', 'المغرب'], ['النوم', 'وضع جسد المسيح في القبر', 'قبل النوم'], ['نصف الليل', 'المجيء التاني · ٣ خدمات', 'بالليل']];
function currentHour() { var hh = new Date().getHours(); return hh < 5 ? 6 : hh < 9 ? 0 : hh < 12 ? 1 : hh < 15 ? 2 : hh < 17 ? 3 : hh < 20 ? 4 : 5; }
function screenAgpeya() {
  var cur = currentHour(), H = HOURS[cur];
  var h = '<div class="screen">' + header('الأجبية', 'صلوات السواعي') + '<main>' +
    '<section style="background:var(--lapis);color:var(--on-lapis);border-radius:18px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center">' +
    '<span style="width:64px;height:64px;border-radius:999px;background:var(--gold-soft);color:var(--ink);box-shadow:inset 0 0 0 3px var(--gold);display:flex;align-items:center;justify-content:center">' + icon('prayer-book', 34) + '</span>' +
    '<span style="font-size:13px;opacity:.85">الساعة دلوقتي</span><b style="font-family:var(--display);font-size:28px;line-height:40px">صلاة ' + H[0] + '</b><span style="font-size:14px">بنفتكر فيها ' + H[1] + '</span>' +
    '<button class="btn" data-act="soon" style="margin-top:8px;background:var(--gold-soft);color:var(--ink);border-radius:999px">ابدأ الصلاة</button></section>' +
    '<section style="display:flex;flex-direction:column;gap:8px"><h2>السواعي</h2><div class="list">' + HOURS.map(function (x, i) {
      return '<div style="' + (i === cur ? 'background:var(--gold-soft)' : '') + '"><span style="display:flex;flex-direction:column"><b>' + x[0] + '</b><span class="muted" style="font-size:13px">' + x[1] + '</span></span><span class="muted" style="font-size:13px;white-space:nowrap">' + (i === cur ? '<b style="color:var(--lapis)">دلوقتي</b>' : x[2]) + '</span></div>';
    }).join('') + '</div><p class="muted" style="margin:0;font-size:12px">نص الصلوات من أجبية موقع الأنبا تكلا، هيتضاف بعد المراجعة.</p></section></main>' + nav('agpeya') + '</div>';
  return h;
}

// ---------- السما ----------
function skyPositions() {
  // ٣٠ نجمة في ٥ صفوف بشكل متعرّج، بتبدأ من فوق يمين
  var p = [];
  for (var row = 0; row < 5; row++) for (var col = 0; col < 6; col++) {
    var x = row % 2 === 0 ? 300 - col * 52 : 40 + col * 52, y = 50 + row * 66 + (col % 2 ? 18 : 0);
    p.push([x, y]);
  }
  return p;
}
function screenSky() {
  var r = day(), pos = skyPositions(), c = r.coptic, n = monthStars(r);
  var svg = '<svg role="img" aria-label="' + ar(n) + ' نجوم منوّرة في ' + c.monthName + '" viewBox="0 0 340 380" width="100%" style="max-width:380px;display:block;margin:0 auto">';
  var lines = '';
  for (var d = 1; d < 30; d++) {
    var a = store.stars[c.year + '-' + c.month + '-' + d], b = store.stars[c.year + '-' + c.month + '-' + (d + 1)];
    if (a && b) lines += '<path d="M' + pos[d - 1][0] + ' ' + pos[d - 1][1] + ' L' + pos[d][0] + ' ' + pos[d][1] + '" stroke="var(--gold)" stroke-width="1.4" stroke-dasharray="3 5" stroke-linecap="round" opacity="0.7"></path>';
  }
  svg += lines;
  for (var dd = 1; dd <= 30; dd++) {
    var p = pos[dd - 1], k = c.year + '-' + c.month + '-' + dd, lit = !!store.stars[k], today = dd === c.day, past = dd < c.day;
    // الأنيميشن على جروب جوّه، عشان الـ transform بتاعه ما يمسحش مكان النجمة
    if (lit) svg += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g' + (today ? ' class="rise" style="transform-box:fill-box;transform-origin:center"' : '') + '><circle r="' + (today ? 19 : 14) + '" fill="#3b2f16" stroke="var(--gold)" stroke-width="1.5"></circle><path d="' + STAR_D + '" transform="scale(' + (today ? 11 : 8.5) + ')" fill="var(--gold)"></path></g></g>';
    else if (today) svg += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><circle r="19" fill="#3b2f16" stroke="var(--gold)" stroke-width="2" stroke-dasharray="4 4"></circle><path d="' + STAR_D + '" transform="scale(11)" fill="none" stroke="var(--gold)" stroke-width="0.12"></path></g>';
    else if (past) svg += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><path d="' + STAR_D + '" transform="scale(8)" fill="none" stroke="var(--vigil-muted)" stroke-width="0.12" stroke-dasharray="0.25 0.2"></path></g>';
    else svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="var(--vigil-muted)" opacity="0.4"></circle>';
    if (c.month === 3 && dd === 12) svg += '<path d="M' + p[0] + ' ' + (p[1] - 16) + ' V' + (p[1] - 8) + ' M' + (p[0] - 4) + ' ' + (p[1] - 12) + ' H' + (p[0] + 4) + '" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round"></path>';
    svg += '<text x="' + p[0] + '" y="' + (p[1] + (today ? 34 : lit ? 28 : past ? 22 : 16)) + '" text-anchor="middle" font-size="11" fill="' + (today ? 'var(--gold)' : 'var(--vigil-muted)') + '"' + (today ? ' font-weight="700"' : '') + '>' + (today ? 'النهارده' : ar(dd)) + '</text>';
  }
  svg += '</svg>';
  var pastDays = Math.max(0, c.day - 1), litPast = 0;
  for (var q = 1; q < c.day; q++) if (store.stars[c.year + '-' + c.month + '-' + q]) litPast++;
  var h = '<div class="screen dark" style="background:var(--vigil)">' +
    '<div style="padding-block:24px 0;padding-left:var(--gut-l);padding-right:var(--gut-r);display:flex;align-items:center;justify-content:space-between"><button class="ring" data-act="nav" data-to="home" aria-label="سراج · الرئيسية" style="width:40px;height:40px">' + lamp(40) + '</button>' + wordmark(70, 20, 'var(--vigil-muted)') + '</div>' +
    '<header style="padding:20px 20px 0;display:flex;align-items:flex-end;justify-content:space-between"><div><p style="margin:0;font-size:13px;color:var(--vigil-muted)">سما الشهر · ' + ar(c.year) + ' للشهداء</p><h1 style="margin:0;font-family:var(--display);font-size:32px;line-height:46px">سما ' + c.monthName + '</h1></div>' +
    '<div><span style="font-family:var(--display);font-size:44px;font-weight:700;color:var(--gold)">' + ar(n) + '</span> <span style="color:var(--vigil-muted);font-size:14px">من ٣٠</span></div></header>' +
    '<main style="padding-top:12px;gap:16px">' + svg +
    '<div style="background:var(--vigil-raised);border-radius:18px;box-shadow:inset 0 0 0 1px var(--vigil-rule);display:grid;grid-template-columns:1fr 1fr">' +
    '<div style="padding:16px"><b style="font-family:var(--display);font-size:24px">' + ar(litPast) + ' من ' + ar(pastDays) + '</b><br><span style="font-size:13px;color:var(--vigil-muted)">أيام فاتت نوّرت فيها نجمتك</span></div>' +
    '<div style="padding:16px;box-shadow:inset 1px 0 0 var(--vigil-rule)"><b style="font-family:var(--display);font-size:24px">٧ نجوم</b><br><span style="font-size:13px;color:var(--vigil-muted)">ورا بعض تعمل كوكبة</span></div></div>' +
    (c.month === 3 && c.day < 16 ? '<div style="background:#3b2f16;border-radius:10px;padding:12px 16px;font-size:14px">صوم الميلاد بيبدأ ١٦ هاتور، الأربع ٢٥ نوفمبر</div>' : '') +
    '</main>' + nav('sky').replace('class="nav"', 'class="nav nav-dark"') + '</div>';
  return h;
}

// ---------- حاسس بإيه ----------
var MOODS = [
  { label: 'متضايق', ref: 'مز ٣٧', p: '37', bg: '#a5321c', fg: '#fffaf0' }, { label: 'قلقان', ref: 'مز ٢٣', p: '23', bg: '#e3dcf1', fg: '#2b1d14' },
  { label: 'زعلان', ref: 'مز ٤٢', p: '42', bg: '#2f56a6', fg: '#fffaf0' }, { label: 'تعبان', ref: 'مز ٦٢', p: '62', bg: '#121726', fg: '#f4ead8' },
  { label: 'عادي', ref: 'مز ١', p: '1', bg: '#ead9b9', fg: '#2b1d14' }, { label: 'في سلام', ref: 'مز ٤', p: '4', bg: '#6c8a35', fg: '#fffaf0' },
  { label: 'فرحان', ref: 'مز ١٠٠', p: '100', bg: '#d4952a', fg: '#2b1d14' }];
var feel = { mood: 5, chosen: false, ps: null };
function screenFeeling() {
  var m = MOODS[feel.mood];
  return '<div class="screen"><section id="mood-hero" style="position:relative;height:min(440px,52vh);overflow:hidden;border-radius:0 0 28px 28px;background:' + m.bg + ';transition:background 200ms">' +
    '<div style="position:relative;z-index:1;padding:24px 20px 0;display:flex;align-items:center;justify-content:space-between"><button class="ring" data-act="nav" data-to="home" aria-label="سراج · الرئيسية" style="width:40px;height:40px">' + lamp(40) + '</button>' +
    '<span id="mood-fg" style="font-family:var(--display);font-size:16px;font-weight:700;color:' + m.fg + '">شعلة سراجك النهارده</span></div>' +
    '<svg id="mood-svg" role="img" aria-label="' + m.label + '" viewBox="0 0 390 440" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%">' + PARTS.flames[feel.mood] + '</svg></section>' +
    '<main style="text-align:center;gap:18px;padding-top:24px"><div><h1 style="margin:0;font-family:var(--display);font-size:26px;line-height:38px">حاسس بإيه النهارده؟</h1><p class="muted" style="margin:6px 0 0;font-size:15px;line-height:24px">حرّك الدايرة لحد ما الشعلة تبقى شبهك، وهنديك مزمور تكلّم ربنا بيه.</p></div>' +
    '<p id="mood-label" aria-live="polite" style="margin:0;font-family:var(--display);font-size:22px;font-weight:700;color:var(--lapis)">' + m.label + '</p>' +
    '<div><input class="mood" type="range" min="0" max="6" step="1" value="' + feel.mood + '" data-in="mood" aria-label="مستوى إحساسك" aria-valuetext="' + m.label + '"><div class="row muted" style="font-size:12px"><span>متضايق</span><span>فرحان</span></div></div>' +
    '<button class="btn" data-act="chooseMood" style="align-self:center;border-radius:999px;padding:0 40px">يلا</button>' +
    '<div id="mood-result">' + moodResult() + '</div>' +
    '<p class="muted" style="margin:auto 0 0;font-size:13px">اختيارك مش بيتحفظ في أي حتة.</p><p class="note" style="margin:0">لو محتاج تتكلم، كلّم أب اعترافك أو خادمك.</p></main>' + nav('feeling') + '</div>';
}
function moodResult() {
  if (!feel.chosen) return '';
  var m = MOODS[feel.mood];
  return '<section role="status" class="card" style="text-align:start;display:flex;flex-direction:column;gap:8px"><span class="muted" style="font-size:13px">' + m.label + '؟ اقرا معانا</span>' +
    '<b style="font-family:var(--display);font-size:24px;color:var(--lapis)">' + m.ref + '</b>' +
    '<p style="margin:0;font-family:var(--scripture);font-size:19px;line-height:34px">' + PSALMS.psalms[m.p].verses[0] + ' …</p>' +
    '<button class="btn" data-act="openPsalm" data-p="' + m.p + '">اقرا المزمور كامل</button></section>';
}
function updateMood(v) {
  feel.mood = v; feel.chosen = false; var m = MOODS[v];
  var hero = document.getElementById('mood-hero'); if (!hero) return;
  hero.style.background = m.bg; document.getElementById('mood-fg').style.color = m.fg;
  var s = document.getElementById('mood-svg'); s.innerHTML = PARTS.flames[v]; s.setAttribute('aria-label', m.label);
  document.getElementById('mood-label').textContent = m.label;
  document.getElementById('mood-result').innerHTML = '';
  var inp = document.querySelector('[data-in="mood"]'); inp.setAttribute('aria-valuetext', m.label);
}

// ---------- لعبة الحفظ: ٤ مراحل ----------
var LV = [
  { n: 1, label: 'المرحلة ١', title: 'املا الفراغات', sub: 'دوس على الكلمة الناقصة', desc: 'دوس على الكلمات اللي تحت عشان تملا الفراغات بالترتيب.', color: '#6a4f9c', soft: '#e3dcf1' },
  { n: 2, label: 'المرحلة ٢', title: 'ابني الآية', sub: 'رتّب الآية كلها', desc: 'الآية كلها فاضية. اختار الكلمات بالترتيب من تحت لحد ما تبنيها.', color: '#2f56a6', soft: '#dce4f4' },
  { n: 3, label: 'المرحلة ٣', title: 'أول حرف', sub: 'تحدي إضافي · اكتب كلمة كلمة', desc: 'كل كلمة باينة بأول حرف بس. اكتب الكلمة الجاية.', color: '#6c8a35', soft: '#e3ecd0', practice: true, challenge: true },
  { n: 4, label: 'المرحلة ٤', title: 'اكتبها كلها', sub: 'تحدي إضافي · من ذاكرتك، بإيدك أو بصوتك', desc: 'اكتب الآية كلها أو قولها بصوتك. لو جبت ٩٠٪ من الكلمات صح، عدّيت.', color: '#a5321c', soft: '#f6d6cb', practice: true, challenge: true }];
var G = null;
function gFresh() { return { screen: 'levels', level: 1, showPractice: true, right: 0, wrong: 0, pos: 0, flash: -1, helped: -1, tip: '', bad: false, typed: '', hint4: false, peek: false, result4: null, micMsg: '', listening: false }; }
function verseNow() { var C = CONTENT[day().key]; return C && C.verse; }
function scoreKey(n) { return day().key + ':' + n; }
function gScores() { var o = {}; for (var i = 1; i <= 4; i++) { var v = store.scores[scoreKey(i)]; if (v !== undefined) o[i] = v; } return o; }
function unlocked() { var s = gScores(), u = 1; while (s[u] !== undefined && u < 4) u++; return u; }
function startGame() { G = gFresh(); go('game'); }
function tokens(s) {
  var a = norm(s).split(' ').filter(Boolean), out = [];
  for (var i = 0; i < a.length; i++) { if (a[i] === 'و' && i + 1 < a.length) { out.push('و' + a[i + 1]); i++; } else out.push(a[i]); }
  return out;
}
function lcsHits(a, b) {
  var m = a.length, n = b.length, dp = [], x, y;
  for (x = 0; x <= m; x++) dp.push(new Array(n + 1).fill(0));
  for (x = m - 1; x >= 0; x--) for (y = n - 1; y >= 0; y--) dp[x][y] = same(a[x], b[y]) ? dp[x + 1][y + 1] + 1 : Math.max(dp[x + 1][y], dp[x][y + 1]);
  var hit = [], i = 0, j = 0;
  while (i < m && j < n) { if (same(a[i], b[j])) { hit.push(i); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return hit;
}
function screenGame() {
  var V = verseNow(); if (!V) { return screenHome(); }
  if (!G) G = gFresh();
  var L = LV[G.level - 1], W = V.words, T = W.map(norm), S = gScores();
  if (G.screen === 'levels') {
    var u = unlocked();
    return '<div class="screen">' + header('احفظ الآية', V.ref) + '<main style="gap:14px"><p class="verse" style="font-size:19px;line-height:34px">' + W.join(' ') + '</p>' + LV.map(function (lv) {
      var done = S[lv.n] !== undefined, open = lv.n <= u, cur = open && !done && lv.n === u;
      return '<div style="border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:12px;' + (cur ? 'background:' + lv.color + ';color:#fffaf0' : 'background:var(--page-raised);box-shadow:inset 0 0 0 1.5px var(--rule);' + (open ? '' : 'opacity:.6')) + '">' +
        '<div style="display:flex;align-items:center;gap:12px"><span style="width:40px;height:40px;flex-shrink:0;border-radius:999px;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:18px;font-weight:700;color:var(--ink);background:var(--gold-soft);box-shadow:inset 0 0 0 2.5px var(--gold),0 0 0 1px var(--ink)">' + ar(lv.n) + '</span>' +
        '<div style="flex:1"><b style="font-family:var(--display);font-size:17px">' + lv.title + '</b><br><span style="font-size:13px;opacity:.8">' + lv.sub + '</span></div><b style="font-size:13px">' + (done ? 'خلصت · ' + ar(S[lv.n]) + '٪' : open ? (lv.challenge ? 'تحدي' : '') : 'مقفولة') + '</b></div>' +
        (open ? '<button data-act="gOpen" data-n="' + lv.n + '" style="min-height:44px;border:none;border-radius:999px;cursor:pointer;font-family:var(--display);font-size:16px;font-weight:700;' + (cur ? 'background:' + lv.soft + ';color:var(--ink)' : 'background:transparent;color:var(--lapis);box-shadow:inset 0 0 0 1.5px var(--rule)') + '">' + (done ? 'العب تاني' : 'العب') + '</button>' : '') + '</div>';
    }).join('') + '</main>' + nav('') + '</div>';
  }
  if (G.screen === 'intro') {
    return '<div class="screen" style="background:' + L.color + ';color:#fffaf0;align-items:center;justify-content:center;text-align:center;gap:10px;padding:88px 24px 32px;position:relative">' +
      '<button data-act="gLevels" aria-label="رجوع للمراحل" style="position:absolute;top:24px;right:20px;width:40px;height:40px;border-radius:999px;border:none;background:rgba(255,250,240,.25);color:inherit;font-size:20px;cursor:pointer">×</button>' +
      '<p style="margin:0;font-family:var(--display);font-size:18px;opacity:.8">' + L.label + '</p><h1 style="margin:0;font-family:var(--display);font-size:40px;line-height:54px">' + L.title + '</h1><p style="margin:0;font-size:15px;max-width:320px">' + L.desc + '</p>' +
      (L.practice ? '<div style="width:100%;max-width:420px;text-align:start;background:var(--page-raised);color:var(--ink);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px"><p class="muted" style="margin:0;font-size:14px">تمرين: اقرا الآية بصوت عالي، وبعدين اخفيها وقولها من ذاكرتك.</p>' +
        (G.showPractice ? '<p class="verse" style="font-size:19px;line-height:34px">' + W.join(' ') + ' <span class="muted" style="font-family:var(--body);font-size:13px">(' + V.ref + ')</span></p>' : '') +
        '<button class="pill on" data-act="gPractice" style="align-self:flex-start">' + (G.showPractice ? 'اخفي الآية' : 'وريني الآية') + '</button></div>' : '') +
      '<button data-act="gStart" style="margin-top:16px;min-height:52px;padding:0 44px;border-radius:999px;border:none;background:var(--gold-soft);color:var(--ink);box-shadow:0 0 0 2px var(--ink);font-family:var(--display);font-size:17px;font-weight:700;cursor:pointer">يلا نبدأ</button></div>';
  }
  if (G.screen === 'complete') {
    var sc = S[G.level] || 0;
    var note = G.level === 1 ? 'فتحت المرحلة ٢: ابني الآية. خلّصها وتنوّر نجمة النهارده.' : G.level === 2 ? 'كده نجمة النهارده نوّرت.' : G.level === 3 ? 'فاضل آخر تحدي: اكتبها كلها.' : 'عدّيت المراحل الأربعة.';
    return '<div class="screen" style="background:' + L.soft + ';align-items:center;justify-content:center;gap:14px;text-align:center;padding:40px 24px">' +
      '<span style="width:64px;height:64px;border-radius:999px;background:' + L.color + ';box-shadow:0 0 0 3px var(--gold);display:flex;align-items:center;justify-content:center">' + star(34, 'var(--gold)', 'var(--ink)') + '</span>' +
      '<h1 style="margin:0;font-family:var(--display);font-size:30px;line-height:42px">خلصت ' + L.label + '</h1>' +
      '<div role="img" aria-label="النتيجة ' + ar(sc) + '٪" style="position:relative;width:220px;height:130px"><svg viewBox="0 0 220 130" width="220" height="130" aria-hidden="true"><path d="M30 115 A80 80 0 0 1 190 115" fill="none" stroke="var(--rule)" stroke-width="14" stroke-linecap="round"></path><path d="M30 115 A80 80 0 0 1 190 115" fill="none" stroke="' + L.color + '" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="' + sc + ' 100"></path></svg>' +
      '<div style="position:absolute;inset:auto 0 6px 0;display:flex;flex-direction:column;align-items:center;line-height:1.2"><span class="muted" style="font-size:14px">النتيجة</span><b dir="rtl" style="font-family:var(--display);font-size:32px;line-height:40px;unicode-bidi:isolate">' + ar(sc) + '٪</b></div></div>' +
      '<p style="margin:0">' + note + '</p><button class="btn" data-act="gContinue" style="border-radius:999px;padding:0 40px">كمّل</button></div>';
  }
  if (G.screen === 'final') {
    var all = S[4] !== undefined;
    return '<div class="screen"><main style="align-items:center;text-align:center;gap:14px;padding-top:40px">' +
      '<div class="rise" style="width:72px;height:72px;border-radius:999px;background:var(--gold-soft);box-shadow:inset 0 0 0 3px var(--gold),0 0 0 1.5px var(--ink);display:flex;align-items:center;justify-content:center">' + star(46, 'var(--gold)', 'var(--ink)') + '</div>' +
      '<h1 style="margin:0;font-family:var(--display);font-size:24px;line-height:34px">' + (all ? 'خلصت التحدي كله' : 'نجمة النهارده نوّرت') + '</h1>' +
      '<p class="muted" style="margin:0;font-size:14px">' + (all ? 'كتبت الآية من ذاكرتك. النجمة نوّرت من بعد المرحلة ٢.' : 'دي نجمتك رقم ' + ar(monthStars(day())) + ' في ' + day().coptic.monthName + '. عايز تثبّتها أكتر؟ جرّب التحدي.') + '</p>' +
      '<div style="display:flex;gap:14px;align-items:center;width:100%">' +
      '<figure aria-label="معاينة صورة الستوري" style="margin:0;width:140px;height:249px;flex-shrink:0;border-radius:12px;background:var(--lapis);padding:10px 12px;display:flex;flex-direction:column;align-items:center;gap:5px">' +
      '<span class="ring" style="width:24px;height:24px;box-shadow:0 0 0 1.5px var(--gold)">' + lamp(24) + '</span>' +
      '<div style="width:100%;flex:1;border-radius:999px 999px 6px 6px;background:var(--page);box-shadow:0 0 0 2px var(--ink),0 0 0 4px var(--gold);padding:24px 8px 8px;display:flex;flex-direction:column;align-items:center;gap:4px"><b style="font-family:var(--display);font-size:10px;color:var(--cinnabar)">' + V.ref + '</b><span style="font-family:var(--scripture);font-size:9px;line-height:15px">' + W.join(' ') + '</span></div>' +
      '<span style="font-size:8px;color:var(--gold-soft)">حفظت الآية دي مع</span>' + wordmark(46, 13, 'var(--gold-soft)') + '</figure>' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="share" style="background:var(--ink);color:var(--page-raised);border-radius:999px;font-size:16px">شارك ستوري</button>' +
      '<button class="btn" data-act="nav" data-to="sky" style="background:none;color:var(--ink);box-shadow:inset 0 0 0 2px var(--ink);border-radius:999px;font-size:16px">شوف سماك</button>' +
      (all ? '' : '<button class="btn" data-act="gChallenge" style="background:var(--olive);border-radius:999px;font-size:15px">خد التحدي</button>') + '</div></div>' +
      '<button data-act="gLevels" style="background:none;border:none;color:var(--lapis);font-weight:600;min-height:44px;cursor:pointer">المراحل</button></main>' + nav('') + storySheet() + '</div>';
  }
  // اللعب
  var total = G.right + G.wrong, score = total ? Math.round(100 * G.right / total) : 0;
  var h = '<div class="screen" style="background:' + L.soft + ';min-height:var(--vvh,100vh)">' +
    '<div class="row" style="padding:24px 20px 0"><button data-act="gLevels" aria-label="رجوع للمراحل" style="width:40px;height:40px;border-radius:999px;border:none;background:rgba(43,29,20,.08);font-size:20px;cursor:pointer">×</button>' +
    '<div style="display:flex;flex-direction:column;align-items:flex-end"><span class="muted" style="font-size:12px">النتيجة</span><b style="font-family:var(--display);font-size:22px;color:' + L.color + '">' + ar(score) + '٪</b></div></div>' +
    '<div class="row" style="padding:8px 20px 0;align-items:baseline"><h1 style="margin:0;font-family:var(--display);font-size:24px">' + V.ref + '</h1><b class="muted" style="font-size:13px">' + L.label + ' · ' + L.title + '</b></div>';
  if (G.level < 4) {
    h += '<p style="margin:12px 20px 0;display:flex;flex-wrap:wrap;align-items:center;gap:8px 6px;font-family:var(--scripture);font-size:20px;line-height:34px">' + W.map(function (w, i) {
      var filled = 'background:var(--page-raised);box-shadow:inset 0 0 0 1.5px ' + L.color;
      var empty = function (now) { return 'min-width:' + Math.max(36, norm(w).length * 9) + 'px;background:rgba(255,250,240,.5);box-shadow:inset 0 0 0 ' + (now ? '2.5px var(--ink)' : '1.5px ' + L.color + '66'); };
      if (G.level === 1) { var g = V.gaps.indexOf(i); if (g === -1) return '<span>' + w + '</span>'; return g < G.pos ? '<span class="slot" style="' + filled + '">' + w + '</span>' : '<span class="slot" style="' + empty(g === G.pos) + '"></span>'; }
      if (G.level === 2) return i < G.pos ? '<span class="slot" style="' + filled + '">' + w + '</span>' : '<span class="slot" style="' + empty(i === G.pos) + '"></span>';
      if (i < G.pos) return '<span class="slot" style="' + filled + '">' + w + '</span>';
      return '<span class="slot" style="' + (i === G.pos ? 'box-shadow:inset 0 0 0 2.5px var(--ink);background:var(--page-raised)' : 'opacity:.55;color:var(--ink-muted)') + '">' + (i === G.helped ? w : norm(w).charAt(0) + 'ـــ') + '</span>';
    }).join('') + '</p>';
  } else {
    var hits = lcsHits(T, tokens(G.typed));
    h += '<div style="margin:12px 20px 0;display:flex;flex-direction:column;gap:10px">' +
      (G.peek ? '<p class="verse" style="margin:0;background:var(--page-raised);border-radius:10px;padding:10px 14px;font-size:18px;line-height:32px">' + W.join(' ') + '</p>' : '') +
      '<div id="g-letters" style="display:' + (G.hint4 ? 'flex' : 'none') + ';flex-wrap:wrap;gap:6px;font-family:var(--scripture);font-size:19px;line-height:28px">' + lettersHtml(W, hits) + '</div>' +
      '<textarea id="g-typed" dir="rtl" rows="5" data-in="typed" aria-label="اكتب الآية كلها" placeholder="اكتب الآية من ذاكرتك، أو قولها بصوتك…" style="width:100%;resize:none;border:none;border-radius:14px;background:var(--page-raised);box-shadow:inset 0 0 0 2px ' + L.color + '55;padding:12px 14px;font-family:var(--scripture);font-size:20px;line-height:36px;color:var(--ink)">' + esc(G.typed) + '</textarea>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill' + (G.hint4 ? ' on' : '') + '" data-act="gHint4">أول حرف</button><button class="pill' + (G.peek ? ' on' : '') + '" data-act="gPeek">' + (G.peek ? 'اخفي الآية' : 'بُص بصّة') + '</button>' +
      (G.micOff ? '' : '<button class="pill" data-act="gMic" style="' + (G.listening ? 'background:var(--cinnabar);color:#fffaf0;box-shadow:none' : '') + '">' + (G.listening ? 'بيسمعك… دوس توقف' : 'قولها بصوتك') + '</button>') + '</div>' +
      (G.micMsg ? '<p role="status" class="muted" style="margin:0;font-size:13px">' + G.micMsg + '</p>' : '') + '</div>';
  }
  var tip = G.tip || (G.level < 3 ? 'دوس على الكلمة اللي عليها الدور.' : G.level === 3 ? 'اكتب الكلمة الجاية في الآية.' : 'محتاج ٩٠٪ من الكلمات صح عشان تعدّي.');
  h += '<p role="status" id="g-tip" style="margin:12px 20px 0;font-size:14px;font-weight:600;color:' + (G.bad ? 'var(--cinnabar)' : 'var(--ink-muted)') + '">' + tip + '</p>';
  h += '<div style="margin-top:auto;background:' + L.color + ';border-radius:24px 24px 0 0;padding:18px 20px calc(24px + var(--safe-bottom));display:flex;flex-direction:column;gap:14px">';
  if (G.level < 3) {
    var need = G.level === 1 ? V.gaps[G.pos] : G.pos;
    var idx = G.level === 1 ? V.gaps.slice().sort(function (a, b) { return (a * 7) % 11 - (b * 7) % 11; }) : W.map(function (_, i) { return i; }).sort(function (a, b) { return ((a * 7 + 3) % 17) - ((b * 7 + 3) % 17); });
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px">' + idx.map(function (i) {
      var used = G.level === 1 ? V.gaps.indexOf(i) < G.pos : i < G.pos;
      if (used) return '';
      var st = G.flash === i ? 'background:var(--cinnabar);color:#fffaf0' : G.helped === i ? 'background:var(--gold-soft);box-shadow:0 0 0 3px var(--gold)' : 'background:' + L.soft;
      return '<button class="chip" data-act="gPick" data-i="' + i + '" style="' + st + '">' + W[i] + '</button>';
    }).join('') + '</div>';
  }
  if (G.level === 3) h += '<div style="display:flex;gap:8px"><input id="g-word" type="text" dir="rtl" autocomplete="off" autocapitalize="off" data-in="word3" aria-label="اكتب الكلمة الجاية" placeholder="اكتب الكلمة الجاية" style="flex:1;min-width:0;height:48px;border:none;border-radius:12px;padding:0 14px;background:var(--page-raised);box-shadow:inset 0 0 0 2px ' + (G.bad ? 'var(--cinnabar)' : 'var(--rule)') + ';font-family:var(--scripture);font-size:20px;color:var(--ink)"><button data-act="gSubmit3" aria-label="ابعت" style="width:48px;height:48px;flex-shrink:0;border:none;border-radius:999px;background:var(--gold-soft);box-shadow:0 0 0 2px var(--ink);font-size:20px;font-weight:700;cursor:pointer">←</button></div>';
  h += '<div class="row"><button data-act="gHelp" style="min-height:44px;padding:0 18px;border:none;border-radius:999px;background:rgba(255,250,240,.18);color:#fffaf0;box-shadow:inset 0 0 0 1.5px rgba(255,250,240,.5);font-weight:700;cursor:pointer">' + (G.level === 4 ? 'مساعدة: أول حرف' : 'ساعدني') + '</button>' +
    (G.level === 4 ? '<button data-act="gCheck4" style="min-height:48px;padding:0 32px;border:none;border-radius:999px;background:var(--gold-soft);color:var(--ink);box-shadow:0 0 0 2px var(--ink);font-family:var(--display);font-size:16px;font-weight:700;cursor:pointer">اتأكد</button>' : '') + '</div></div>';
  if (G.result4 !== null) {
    var hits4 = lcsHits(T, tokens(G.typed));
    h += '<div class="sheet-wrap" style="background:rgba(43,29,20,.35)"><div role="status" style="background:var(--cinnabar);color:#fffaf0;border-radius:24px 24px 0 0;padding:24px 20px calc(28px + var(--safe-bottom));display:flex;flex-direction:column;gap:12px">' +
      '<b style="font-family:var(--display);font-size:24px">لسه شوية. جبت ' + ar(G.result4) + '٪</b><p style="margin:0;font-family:var(--scripture);font-size:18px;line-height:32px">' + W.map(function (w, i) { return hits4.indexOf(i) !== -1 ? w : '<u style="text-decoration-thickness:2px;text-underline-offset:6px;color:var(--gold-soft);font-weight:700">' + w + '</u>'; }).join(' ') + '</p>' +
      '<p style="margin:0;font-size:13px;opacity:.85">الكلمات اللي تحتها خط هي اللي فاتتك. محتاج ٩٠٪ عشان تعدّي.</p><button data-act="gRetry" style="min-height:48px;border:none;border-radius:999px;background:var(--gold-soft);color:var(--ink);font-family:var(--display);font-size:16px;font-weight:700;cursor:pointer">جرّب تاني</button></div></div>';
  }
  return h + '</div>';
}
function storySheet() {
  if (!ui.story) return '';
  return '<div class="sheet-wrap" data-act="closeStory"><section class="sheet" role="dialog" aria-modal="true" aria-label="صورة الستوري" data-stop="1" style="align-items:center;text-align:center">' +
    '<span class="grab" aria-hidden="true"></span><img src="' + ui.story + '" alt="صورة ستوري بالآية" style="width:min(240px,60vw);border-radius:12px;box-shadow:0 8px 20px -10px rgba(43,29,20,.6)">' +
    '<p style="margin:0;font-size:15px;line-height:24px">دوس «شارك الصورة»، واختار إنستجرام أو احفظها في الصور.</p>' +
    '<button class="btn" data-act="saveStory" style="width:100%;background:var(--ink);color:var(--page-raised);border-radius:999px">شارك الصورة</button>' +
    '<button class="btn" data-act="closeStory" style="width:100%;background:none;color:var(--lapis)">اقفل</button></section></div>';
}
function lettersHtml(W, hits) {
  return W.map(function (w, i) { var ok = hits.indexOf(i) !== -1; return '<span style="min-width:30px;text-align:center;padding:0 6px;border-radius:6px;' + (ok ? 'background:var(--olive-soft);color:var(--olive)' : 'background:var(--gold-soft)') + '">' + norm(w).charAt(0) + 'ـ</span>'; }).join('');
}
function finishLevel(sc) {
  store.scores[scoreKey(G.level)] = sc;
  if (G.level >= 2 && !isFuture()) store.stars[day().key] = true;   // النجمة بتنوّر بعد المرحلة ٢، ومش بتنوّر في يوم لسه ماجاش
  save(); G.screen = 'complete'; G.tip = ''; render();
}
function accept3(val, loose) {
  var V = verseNow(), T = V.words.map(norm), v = norm(val);
  if (!(v === T[G.pos] || (loose && same(v, T[G.pos])))) return false;
  G.pos++; G.right++; G.helped = -1; G.tip = 'اكتب الكلمة الجاية.'; G.bad = false;
  if (G.pos >= T.length) finishLevel(Math.round(100 * G.right / (G.right + G.wrong)));
  else { render(); var i = document.getElementById('g-word'); if (i) i.focus(); }
  return true;
}
var rec = null;
function stopMic() { if (rec) { try { rec.stop(); } catch (e) {} } if (typeof G !== 'undefined' && G) G.listening = false; }
var MIC_KEYBOARD = 'الكتابة بالصوت مش شغالة هنا. دوس في المربع واستخدم زرار الميكروفون اللي في الكيبورد.';

// ---------- صورة الستوري ----------
function shareStory() {
  var V = verseNow(); if (!V) return;
  function lines(x, text, max) { var out = [], cur = ''; text.split(' ').forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }
  function paint(lampImg) {
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1920; var x = c.getContext('2d');
    x.fillStyle = '#1f3a75'; x.fillRect(0, 0, 1080, 1920);
    x.strokeStyle = 'rgba(212,149,42,0.16)'; x.lineWidth = 4; x.lineCap = 'round';
    for (var gx = 36; gx < 1080; gx += 84) for (var gy = 36; gy < 1920; gy += 84) { x.beginPath(); x.moveTo(gx, gy - 14); x.lineTo(gx, gy + 14); x.moveTo(gx - 14, gy); x.lineTo(gx + 14, gy); x.stroke(); }
    if (lampImg) { x.beginPath(); x.arc(540, 175, 104, 0, Math.PI * 2); x.lineWidth = 8; x.strokeStyle = '#d4952a'; x.stroke(); x.drawImage(lampImg, 444, 79, 192, 192); }
    function arch() { x.beginPath(); x.moveTo(110, 760); x.arc(540, 760, 430, Math.PI, 0); x.lineTo(970, 1480); x.lineTo(110, 1480); x.closePath(); }
    arch(); x.fillStyle = '#f5ecdc'; x.fill(); x.lineWidth = 26; x.strokeStyle = '#d4952a'; x.stroke(); arch(); x.lineWidth = 8; x.strokeStyle = '#2b1d14'; x.stroke();
    x.save(); x.translate(540, 470); x.scale(70, 70); x.fillStyle = '#d4952a'; x.fill(new Path2D(STAR_D)); x.lineWidth = 0.06; x.strokeStyle = '#2b1d14'; x.stroke(new Path2D(STAR_D)); x.restore();
    x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#a5321c'; x.font = '700 64px "Reem Kufi", Tahoma, sans-serif'; x.fillText(V.ref, 540, 640);
    x.fillStyle = '#2b1d14'; x.font = '60px "Amiri", serif';
    lines(x, V.words.join(' '), 720).forEach(function (l, k) { x.fillText(l, 540, 780 + k * 112); });
    x.fillStyle = '#f6e2b5'; x.font = '700 44px "IBM Plex Sans Arabic", Tahoma, sans-serif'; x.fillText('حفظت الآية دي مع', 540, 1586);
    var sc = 320 / 3129; x.save(); x.translate(540 - 160 - 42 * sc, 1640 + 723 * sc); x.scale(sc, sc); x.fillStyle = '#f6e2b5'; x.fill(new Path2D(PARTS.wordmark)); x.restore();
    x.fillStyle = 'rgba(255,250,240,0.8)'; x.font = '36px "IBM Plex Sans Arabic", Tahoma, sans-serif'; x.fillText('سراج · نور لجيل جديد', 540, 1800);
    ui.story = c.toDataURL('image/png');
    c.toBlob(function (b) { ui.storyBlob = b; }, 'image/png');
    render();
  }
  var img = new Image();
  img.onload = function () { paint(img); }; img.onerror = function () { paint(null); };
  var fontsReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('60px "Amiri"'), document.fonts.load('700 64px "Reem Kufi"'), document.fonts.load('700 44px "IBM Plex Sans Arabic"')]) : Promise.resolve();
  fontsReady.then(function () { img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="360" height="360">' + PARTS.lamp + '</svg>'); }, function () { paint(null); });
}

// ---------- الرسم والأحداث ----------
function render() {
  var map = { home: screenHome, readings: screenReadings, saint: screenSaint, agpeya: screenAgpeya, sky: screenSky, feeling: screenFeeling, game: screenGame, verses: screenVerses, psalm: screenPsalm };
  var fn = map[route] || screenHome;
  if (route === 'game' && !verseNow()) fn = screenHome;
  app.innerHTML = fn();
  app.style.minHeight = route === 'game' ? '0' : '';
  document.documentElement.style.background = route === 'sky' ? '#121726' : '';
}
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]'); if (!el) return;
  if (el.classList.contains('sheet-wrap') && e.target.closest('[data-stop]')) return;
  var a = el.getAttribute('data-act'), V = verseNow();
  switch (a) {
    case 'nav': go(el.getAttribute('data-to')); break;
    case 'soon': toast('جاية في نسخة قريبة.'); break;
    case 'demo': setPicked(DEMO_DATE); go('home'); render(); break;
    case 'real': setPicked(null); render(); break;
    case 'dayShift': setPicked(shiftDate(appDate(), +el.getAttribute('data-n'))); render(); break;
    case 'pickOpen': ui.picker = true; render(); var pd = document.getElementById('pick-date'); if (pd) pd.focus(); break;
    case 'pickClose': ui.picker = false; render(); break;
    case 'pickGo': { var pv = (document.getElementById('pick-date') || {}).value; var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(pv || ''); if (!m) { toast('اختار تاريخ الأول.'); break; } setPicked([+m[1], +m[2], +m[3]]); render(); window.scrollTo(0, 0); break; }
    case 'hideInstall': store.installHidden = true; save(); render(); break;
    case 'info': ui.info = true; render(); break;
    case 'closeInfo': ui.info = false; render(); break;
    case 'game': startGame(); break;
    case 'openPsalm': feel.ps = el.getAttribute('data-p'); go('psalm'); break;
    case 'review': { var kp = el.getAttribute('data-k').split('-').map(Number), gd = E.jdnToGregorian(E.copticToJdn(kp[0], kp[1], kp[2])); setPicked([gd.year, gd.month, gd.day]); startGame(); break; }
    case 'chooseMood': feel.chosen = true; document.getElementById('mood-result').innerHTML = moodResult(); break;
    case 'gOpen': G.level = +el.getAttribute('data-n'); G.screen = 'intro'; G.showPractice = true; render(); break;
    case 'gLevels': stopMic(); G.screen = 'levels'; render(); break;
    case 'gPractice': G.showPractice = !G.showPractice; render(); break;
    case 'gStart': Object.assign(G, { screen: 'play', right: 0, wrong: 0, pos: 0, flash: -1, helped: -1, tip: '', bad: false, typed: '', hint4: false, peek: false, result4: null, micMsg: '' }); render(); break;
    case 'gPick': {
      var i = +el.getAttribute('data-i'), need = G.level === 1 ? V.gaps[G.pos] : G.pos;
      if (norm(V.words[i]) === norm(V.words[need])) {
        G.pos++; G.right++; G.flash = -1; G.helped = -1; G.tip = ''; G.bad = false;
        var end = G.level === 1 ? G.pos >= V.gaps.length : G.pos >= V.words.length;
        if (end) finishLevel(Math.round(100 * G.right / (G.right + G.wrong))); else render();
      } else { G.wrong++; G.flash = i; G.tip = 'مش دي. بص على الكلمة اللي قبل الفراغ وجرّب تاني.'; G.bad = true; render(); }
      break;
    }
    case 'gSubmit3': {
      var inp = document.getElementById('g-word'), val = inp ? inp.value : '';
      if (!norm(val) || accept3(val, true)) break;
      G.wrong++; G.tip = 'مش هي. الكلمة دي بتبدأ بحرف «' + norm(V.words[G.pos]).charAt(0) + '».'; G.bad = true; render();
      var i2 = document.getElementById('g-word'); if (i2) { i2.value = val; i2.focus(); }
      break;
    }
    case 'gHelp':
      if (G.level < 3) { G.helped = G.level === 1 ? V.gaps[G.pos] : G.pos; G.wrong++; G.tip = 'دي الكلمة اللي عليها الدور، منوّرة تحت.'; G.bad = false; }
      else if (G.level === 3) { G.helped = G.pos; G.wrong++; G.tip = 'الكلمة باينة فوق. اكتبها عشان تكمّل.'; G.bad = false; }
      else { G.hint4 = true; G.tip = 'ظهرلك أول حرف من كل كلمة. الأخضر هو اللي كتبته صح.'; G.bad = false; }
      render(); break;
    case 'gHint4': G.hint4 = !G.hint4; render(); break;
    case 'gPeek': if (!G.peek) G.wrong++; G.peek = !G.peek; render(); break;
    case 'gMic': {
      if (G.listening) { stopMic(); render(); break; }
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      // جوه Claude الصفحة مش بتاخد إذن ميكروفون، فبنحوّل على ميكروفون الكيبورد على طول
      if (!SR || window.top !== window) { G.micOff = true; G.micMsg = MIC_KEYBOARD; render(); break; }
      try {
        var me = new SR(); rec = me; me.lang = 'ar-EG'; me.interimResults = true; me.continuous = true;
        var before = G.typed.trim() ? G.typed.trim() + ' ' : '';
        me.onresult = function (ev) {
          if (rec !== me) return;
          // كل نتيجة جملة لوحدها، فبنحط مسافة بينهم. أندرويد ساعات بيرجّع الكلام كله من الأول في كل نتيجة، فبناخد الأحدث بدل ما نكرره.
          var parts = [];
          for (var k = 0; k < ev.results.length; k++) {
            var t = ev.results[k][0].transcript.trim(); if (!t) continue;
            var last = parts[parts.length - 1];
            if (last && t.indexOf(last) === 0) parts[parts.length - 1] = t; else parts.push(t);
          }
          G.typed = before + parts.join(' ');
          var ta = document.getElementById('g-typed'); if (ta) ta.value = G.typed; refreshLetters();
        };
        me.onerror = function (ev) {
          if (rec !== me) return;
          var c = ev && ev.error;
          if (c === 'not-allowed' || c === 'service-not-allowed' || c === 'audio-capture') { G.micOff = true; G.micMsg = MIC_KEYBOARD; }
          else if (c === 'no-speech' || c === 'aborted') G.micMsg = 'مسمعتش حاجة. دوس «قولها بصوتك» وابدأ اتكلم على طول.';
          else if (c === 'network') G.micMsg = 'الكتابة بالصوت محتاجة نت. جرّب تاني، أو اكتبها بإيدك.';
          else G.micMsg = 'مقدرتش أسمعك. جرّب تاني، أو اكتبها بإيدك.';
        };
        me.onend = function () { if (rec !== me) return; rec = null; G.listening = false; render(); };
        me.start(); G.listening = true; G.micMsg = ''; render();
      } catch (err) { G.micOff = true; G.micMsg = MIC_KEYBOARD; render(); }
      break;
    }
    case 'gCheck4': {
      var T = V.words.map(norm), typed = tokens(G.typed);
      if (!typed.length) { G.tip = 'اكتب الآية الأول، أو دوس على الميكروفون وقولها.'; G.bad = true; render(); break; }
      stopMic();
      var pct = Math.round(100 * lcsHits(T, typed).length / T.length);
      if (pct >= 90) finishLevel(pct); else { G.result4 = pct; G.wrong++; render(); }
      break;
    }
    case 'gRetry': G.result4 = null; G.hint4 = true; render(); break;
    case 'gContinue': if (G.level === 2 || G.level === 4) G.screen = 'final'; else { G.level++; G.screen = 'intro'; G.showPractice = true; } render(); break;
    case 'gChallenge': { var s = gScores(); G.level = s[3] !== undefined ? 4 : 3; G.screen = 'intro'; G.showPractice = true; render(); break; }
    case 'share': shareStory(); break;
    case 'closeStory': ui.story = null; render(); break;
    case 'saveStory': {
      var blob = ui.storyBlob;
      if (!blob) { toast('ثانية واحدة، الصورة لسه بتتجهز.'); break; }
      var cl = window.claude && window.claude.use ? window.claude.use('downloads') : Promise.resolve(null);
      cl.then(function (dl) {
        if (!dl) { toast('الحفظ مش متاح هنا. خد سكرين شوت للصورة.'); return; }
        return dl.save({ filename: 'siou-verse.png', data: blob }).then(function () { toast('تمام.'); }, function (err) {
          var code = err && err.code;
          if (code === 'declined') return;
          if (code === 'rate_limited') toast('استنى ثانية وجرّب تاني.');
          else toast('الحفظ مش متاح هنا. خد سكرين شوت للصورة.');
        });
      });
      break;
    }
  }
});
function refreshLetters() {
  var V = verseNow(), box = document.getElementById('g-letters'); if (!V || !box) return;
  box.innerHTML = lettersHtml(V.words, lcsHits(V.words.map(norm), tokens(G.typed)));
}
document.addEventListener('input', function (e) {
  var k = e.target.getAttribute('data-in');
  if (k === 'mood') updateMood(+e.target.value);
  else if (k === 'word3') accept3(e.target.value);
  else if (k === 'typed') { G.typed = e.target.value; if (G.bad) { G.bad = false; var t = document.getElementById('g-tip'); if (t) { t.style.color = 'var(--ink-muted)'; } } refreshLetters(); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.getAttribute && e.target.getAttribute('data-in') === 'word3') { e.preventDefault(); var b = document.querySelector('[data-act="gSubmit3"]'); if (b) b.click(); }
  if (e.key === 'Escape' && (ui.info || ui.picker)) { ui.info = false; ui.picker = false; render(); }
});
// لما الكيبورد يفتح، الجزء الظاهر من الشاشة بيصغر. بنخلي شاشة اللعبة بطوله ونرجع لفوق.
function fitViewport() {
  var vv = window.visualViewport; if (!vv) return;
  document.documentElement.style.setProperty('--vvh', Math.round(vv.height) + 'px');
  if (route === 'game') window.scrollTo(0, 0);
}
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitViewport);
fitViewport();
render();
})();
