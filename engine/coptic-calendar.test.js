// اختبارات المحرك: تشغيلها بـ  node --test
// تواريخ عيد القيامة اتفق عليها مع المراجع، والباقي بيتأكد من نتيجة موقع الأنبا تكلا.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gregorianToJdn, jdnToGregorian, jdnToCoptic, copticToJdn,
  paschaJdn, today, isCopticLeap,
} from './coptic-calendar.js';

const pascha = (y) => jdnToGregorian(paschaJdn(y));

test('عيد القيامة ٢٠٢٦ = ١٢ أبريل', () => {
  assert.deepEqual(pascha(2026), { year: 2026, month: 4, day: 12 });
});

test('عيد القيامة ٢٠٢٧ = ٢ مايو', () => {
  assert.deepEqual(pascha(2027), { year: 2027, month: 5, day: 2 });
});

test('عيد القيامة دايمًا يوم حد', () => {
  for (let y = 1990; y <= 2099; y++) {
    assert.equal((paschaJdn(y) + 1) % 7, 0, `السنة ${y}`);
  }
});

test('النيروز ٢٠٢٦: ١١ سبتمبر = ١ توت ١٧٤٣', () => {
  const c = jdnToCoptic(gregorianToJdn(2026, 9, 11));
  assert.deepEqual([c.year, c.month, c.day], [1743, 1, 1]);
});

test('النيروز ٢٠٢٣: ١٢ سبتمبر، لأن ١٧٣٩ كانت كبيسة', () => {
  assert.equal(isCopticLeap(1739), true);
  const c = jdnToCoptic(gregorianToJdn(2023, 9, 12));
  assert.deepEqual([c.year, c.month, c.day], [1740, 1, 1]);
});

test('النهارده ٤ نوفمبر ٢٠٢٦ = ٢٥ بابه ١٧٤٣', () => {
  const c = jdnToCoptic(gregorianToJdn(2026, 11, 4));
  assert.deepEqual([c.year, c.monthName, c.day], [1743, 'بابه', 25]);
});

test('التحويل رايح جاي من غير ما يضيع يوم (١٠٠ سنة)', () => {
  const start = gregorianToJdn(1950, 1, 1), end = gregorianToJdn(2050, 1, 1);
  for (let j = start; j < end; j++) {
    const c = jdnToCoptic(j);
    assert.equal(copticToJdn(c.year, c.month, c.day), j);
  }
});

test('مواسم ٢٠٢٧: الصوم والبصخة والخمسين', () => {
  assert.equal(today(2027, 3, 7).season, 'annual');   // الحد اللي قبل الصوم
  assert.equal(today(2027, 3, 8).season, 'lent');     // أول يوم صوم، اتنين
  assert.equal(today(2027, 3, 8).weekday, 1);
  assert.equal(today(2027, 4, 25).season, 'pascha');  // أحد الشعانين
  assert.equal(today(2027, 5, 2).season, 'pentecost');// عيد القيامة
  assert.equal(today(2027, 6, 20).season, 'pentecost');// العنصرة، اليوم الخمسين
  assert.equal(today(2027, 6, 21).season, 'annual');  // أول صوم الرسل
  assert.deepEqual(today(2027, 6, 20).movable, ['pentecost']);
});
