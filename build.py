# بيبني app/app.js (نسخة Claude) و web/app.js (نسخة الموبايل) من app/app.src.js
import json, shutil
src = open('app-src/app.src.js', encoding='utf8').read()
parts = open('app-src/parts.json', encoding='utf8').read().strip()
v = json.load(open('engine/data/verses-03-hator.json', encoding='utf8')); v['year'] = 1743
syn = json.load(open('engine/data/synaxarium-03-hator.json', encoding='utf8')); ps = json.load(open('engine/data/psalms-feelings.json', encoding='utf8'))
out = src.replace('/*PARTS*/null', parts).replace('/*VERSES*/null', json.dumps(v, ensure_ascii=False)).replace('/*SYNAX*/null', json.dumps(syn, ensure_ascii=False)).replace('/*PSALMS*/null', json.dumps(ps, ensure_ascii=False))
open('app/app.js', 'w', encoding='utf8').write(out)
W = [
 ("""  if (!store.installHidden) h += '<div class="note" style="display:flex;flex-direction:column;gap:8px"><b style="font-family:var(--display)">ثبّت سيو على موبايلك</b><span>من قايمة المتصفح اختار «إضافة إلى الشاشة الرئيسية»، وهيبقى ليه أيقونة زي أي تطبيق.</span>""",
  """  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  if (!store.installHidden && !standalone) h += '<div class="note" style="display:flex;flex-direction:column;gap:8px"><b style="font-family:var(--display)">ثبّت سيو على موبايلك</b><span>آيفون: من سفاري دوس زرار المشاركة واختار «إضافة إلى الشاشة الرئيسية». أندرويد: من قايمة كروم اختار «تثبيت التطبيق».</span>"""),
 ("واختار إنستجرام أو احفظها في الصور.", "واختار إنستجرام أو «حفظ الصورة»."),
]
web = out
for a, b in W:
    assert a in web, a[:40]; web = web.replace(a, b)
a = web.index("      var cl = window.claude && window.claude.use"); b = web.index("      break;\n", web.index("if (code === 'rate_limited')"))
web = web[:a] + """      var file = new File([blob], 'siou-verse.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(function () {}); break; }
      var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'siou-verse.png';
      document.body.appendChild(link); link.click(); link.remove(); toast('الصورة اتحفظت.');
""" + web[b:]
open('web/app.js', 'w', encoding='utf8').write(web)
print('ok', len(out), len(web))
