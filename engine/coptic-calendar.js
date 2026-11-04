// Siou · محرك التقويم القبطي
// كل الحسابات بالـ Julian Day Number (JDN): رقم صحيح لكل يوم، فالتحويل بين التقاويم يبقى جمع وطرح.
// القواعد الطقسية هنا (الأيام المتحركة والمواسم) لازم تتراجع على موقع الأنبا تكلا قبل النشر.

// ---------- الميلادي <-> JDN ----------
export function gregorianToJdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
    Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export function jdnToGregorian(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

// ---------- اليولياني -> JDN (لحساب عيد القيامة) ----------
export function julianToJdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
}

// ---------- القبطي <-> JDN ----------
// ١ توت سنة ١ للشهداء = JDN 1825030 (٢٩ أغسطس ٢٨٤ يولياني).
// ١٢ شهر × ٣٠ يوم + النسيء ٥ أيام، و٦ في السنة الكبيسة (لما السنة % ٤ = ٣).
const COPTIC_EPOCH = 1825030;

export const COPTIC_MONTHS = [
  'توت', 'بابه', 'هاتور', 'كيهك', 'طوبة', 'أمشير', 'برمهات',
  'برمودة', 'بشنس', 'بؤونة', 'أبيب', 'مسرى', 'النسيء',
];

export function copticToJdn(y, m, d) {
  return COPTIC_EPOCH - 1 + 365 * (y - 1) + Math.floor(y / 4) + 30 * (m - 1) + d;
}

export function jdnToCoptic(jdn) {
  const year = Math.floor((4 * (jdn - COPTIC_EPOCH) + 1463) / 1461);
  const month = Math.floor((jdn - copticToJdn(year, 1, 1)) / 30) + 1;
  const day = jdn - copticToJdn(year, month, 1) + 1;
  return { year, month, day, monthName: COPTIC_MONTHS[month - 1] };
}

export const isCopticLeap = (y) => y % 4 === 3;

// ---------- عيد القيامة ----------
// الحساب الأبقطي (خوارزمية Meeus للتقويم اليولياني)، وبعدين نحوّله للميلادي عن طريق JDN.
// التحويل بالـ JDN صح في أي قرن، مش زي زيادة ١٣ يوم اللي صح من ١٩٠٠ لـ ٢٠٩٩ بس.
export function paschaJdn(year) {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return julianToJdn(year, month, day);
}

// ---------- الأيام المتحركة: عدد الأيام من عيد القيامة ----------
export const MOVABLE = {
  jonahFastStart: -69,  // صوم نينوى: الاتنين
  jonahFastEnd: -67,    // صوم نينوى: الأربع
  greatLentStart: -55,  // أول الصوم الكبير: الاتنين
  palmSunday: -7,       // أحد الشعانين
  goodFriday: -2,       // الجمعة العظيمة
  pascha: 0,            // عيد القيامة
  ascension: 39,        // عيد الصعود: الخميس
  pentecost: 49,        // عيد العنصرة: الحد
  apostlesFastStart: 50 // صوم الرسل: الاتنين اللي بعد العنصرة
};

// عيد الرسل ثابت: ٥ أبيب، وفيه بيخلص صوم الرسل.
export const APOSTLES_FEAST = { month: 11, day: 5 };

// ---------- الموسم: بيحدد أنهي قطمارس نقرا منه ----------
// annual = القطمارس السنوي · lent = قطمارس الصوم الكبير
// pascha = كتاب البصخة (أسبوع الآلام) · pentecost = قطمارس الخمسين
export function seasonFor(jdn, gYear) {
  const p = paschaJdn(gYear);
  const off = jdn - p;
  if (off >= MOVABLE.greatLentStart && off < MOVABLE.palmSunday) return 'lent';
  if (off >= MOVABLE.palmSunday && off < 0) return 'pascha';
  if (off >= 0 && off <= MOVABLE.pentecost) return 'pentecost';
  return 'annual';
}

// ---------- الواجهة اللي التطبيق بيستخدمها ----------
// بياخد تاريخ ميلادي، ويرجّع كل اللي شاشة «النهارده» محتاجاه.
export function today(gYear, gMonth, gDay) {
  const jdn = gregorianToJdn(gYear, gMonth, gDay);
  const coptic = jdnToCoptic(jdn);
  const p = paschaJdn(gYear);
  const offsetFromPascha = jdn - p;
  const movable = Object.entries(MOVABLE)
    .filter(([, off]) => off === offsetFromPascha)
    .map(([name]) => name);
  return {
    gregorian: { year: gYear, month: gMonth, day: gDay },
    coptic,
    season: seasonFor(jdn, gYear),
    offsetFromPascha,
    movable,                 // مناسبة متحركة النهارده لو فيه
    weekday: (jdn + 1) % 7,  // ٠ = الحد
  };
}
