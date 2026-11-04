// اختبارات قراءات هاتور: تشغيلها بـ  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readingsFor, parseRef, formatRef, displayRef, lxxToHebrew, hebrewToLxxChapter, SLOTS } from './readings.js';

const hator = JSON.parse(readFileSync(new URL('./data/katameros-annual-03-hator.json', import.meta.url), 'utf8'));

test('الملف كامل: ٣٠ يوم و٥ آحاد، وفي كل واحد الـ ٩ خانات', () => {
  for (let d = 1; d <= 30; d++) for (const s of SLOTS) assert.ok(hator.days[d]?.[s]?.length, `يوم ${d} خانة ${s}`);
  for (let n = 1; n <= 5; n++) for (const s of SLOTS) assert.ok(hator.sundays[n]?.[s]?.length, `أحد ${n} خانة ${s}`);
});

test('كل شاهد في الملف بيتقري من غير خطأ', () => {
  const all = [...Object.values(hator.days), ...Object.values(hator.sundays)]
    .flatMap((e) => SLOTS.flatMap((s) => e[s]));
  for (const r of all) assert.doesNotThrow(() => parseRef(r), r);
});

test('قراءة الشاهد وعرضه بالأرقام الشرقية', () => {
  assert.equal(formatRef('لوقا 8 : 4 - 15'), 'لوقا ٨: ٤–١٥');
  assert.equal(formatRef('2 كورنثوس 4 : 5 - 5 : 11'), '٢ كورنثوس ٤: ٥–٥: ١١');
  assert.equal(formatRef('مزامير 89 : 36 , 29'), 'مزامير ٨٩: ٣٦، ٢٩');
  assert.equal(formatRef('مزامير 19 : 4'), 'مزامير ١٩: ٤');
});

test('٢٥ هاتور ١٧٤١ (أربع، ٤ ديسمبر ٢٠٢٤): أبي سيفين، إنجيل القداس متى ١٢: ٩–٢٣', () => {
  const r = readingsFor(2024, 12, 4);
  assert.equal(r.title, '25 هاتور');
  assert.deepEqual(r.readings.LG, ['متى 12 : 9 - 23']);
});

test('الحد ١ ديسمبر ٢٠٢٤ (٢٢ هاتور) بياخد قراءات الأحد الرابع', () => {
  const r = readingsFor(2024, 12, 1);
  assert.equal(r.title, 'الأحد الرابع من هاتور');
  assert.deepEqual(r.readings.LG, ['مرقس 10 : 17 - 31']);
});

test('هاتور ١٧٤٣: الحد ١٥ نوفمبر ٢٠٢٦ (٦ هاتور) = الأحد الأول', () => {
  const r = readingsFor(2026, 11, 15);
  assert.equal(r.coptic.day, 6);
  assert.equal(r.title, 'الأحد الأول من هاتور');
  assert.deepEqual(r.readings.LG, ['لوقا 8 : 4 - 15']);
  assert.deepEqual(r.flagged, []);   // المراجع خلّص كل الملاحظات
  assert.deepEqual(r.readings.MP, ['مزامير 65 : 9 - 10']);
  assert.equal(r.status, 'reviewed');
  assert.equal(r.display.LP[0], 'مزامير ٦٥: ١١–١٢ (٦٤ في القطمارس)');
});

test('يوم من غير هاتور بيقول إن قراءاته لسه مش موجودة، ومش بيخمّن', () => {
  assert.equal(readingsFor(2026, 11, 4).status, 'missing');   // ٢٥ بابه
});

test('قرارات المراجع اتطبّقت', () => {
  assert.deepEqual(hator.days[24].PA, ['1 تيموثاوس 5 : 17 - 6 : 2']);
  assert.deepEqual(hator.sundays[3].PA, ['2 تسالونيكي 1 : 1 - 12']);
  assert.deepEqual(hator.days[12].LG, ['متى 13 : 24 - 54']);
  assert.equal(hator.psalmNumbering, 'VanDyck');
  assert.deepEqual(hator.sundays[1].LP, ['مزامير 65 : 11 - 12']);   // كان سبعيني ٦٤
  assert.deepEqual(hator.sundays[3].LP, ['مزامير 66 : 14 - 15']);   // كان سبعيني ٦٥
  assert.equal(hator.flags.length, 0);
});

test('ترقيم المزامير: فاندايك في الملف، والسبعيني جنبه في العرض', () => {
  assert.deepEqual(lxxToHebrew(22), { chapter: 23, verse: 1 });
  assert.deepEqual(lxxToHebrew(115, 1), { chapter: 116, verse: 10 });
  assert.equal(hebrewToLxxChapter(23), 22);
  assert.equal(hebrewToLxxChapter(116, 12), 115);
  assert.equal(hebrewToLxxChapter(150), 150);
  assert.equal(displayRef('مزامير 132 : 9 , 10 , 17 , 18'), 'مزامير ١٣٢: ٩، ١٠، ١٧، ١٨ (١٣١ في القطمارس)');
  assert.equal(displayRef('مزامير 8 : 2 - 3'), 'مزامير ٨: ٢–٣');
  assert.equal(displayRef('لوقا 8 : 4 - 15'), 'لوقا ٨: ٤–١٥');
});
