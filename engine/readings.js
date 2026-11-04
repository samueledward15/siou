// Siou · قراءات اليوم
// بياخد ناتج today() من محرك التقويم، ويرجّع شواهد القطمارس لليوم ده.
// دلوقتي القطمارس السنوي لشهر هاتور بس. باقي الشهور والمواسم هتتضاف بنفس الشكل.
import { readFileSync } from 'node:fs';
import { today } from './coptic-calendar.js';

// ملفات الشهور: data/katameros-annual-<رقم الشهر>-<اسمه>.json
const ANNUAL = {
  3: JSON.parse(readFileSync(new URL('./data/katameros-annual-03-hator.json', import.meta.url), 'utf8')),
};

export const SLOTS = ['VP', 'VG', 'MP', 'MG', 'PA', 'CA', 'AC', 'LP', 'LG'];

// ---------- قراءة الشاهد ----------
// "2 كورنثوس 4 : 5 - 5 : 11" | "متى 16 : 13 - 19" | "مزامير 89 : 36 , 29" | "مزامير 19 : 4"
export function parseRef(ref) {
  const m = ref.match(/^(.+?)\s(\d+)\s:\s(.+)$/);
  if (!m) throw new Error(`شاهد مش مفهوم: ${ref}`);
  const [, book, ch, rest] = m;
  const chapter = Number(ch);
  const cross = rest.match(/^(\d+)\s-\s(\d+)\s:\s(\d+)$/);           // من إصحاح لإصحاح
  if (cross) return { book, kind: 'cross', from: { chapter, verse: +cross[1] }, to: { chapter: +cross[2], verse: +cross[3] } };
  const range = rest.match(/^(\d+)\s-\s(\d+)$/);                      // مدى في نفس الإصحاح
  if (range) return { book, kind: 'range', chapter, from: +range[1], to: +range[2] };
  if (/^\d+(\s,\s\d+)*$/.test(rest))                                  // آيات متفرقة بالترتيب اللي بتتقري بيه
    return { book, kind: 'list', chapter, verses: rest.split(' , ').map(Number) };
  throw new Error(`شاهد مش مفهوم: ${ref}`);
}

// ---------- عرض الشاهد بالأرقام الشرقية: «لوقا ٨: ٤–١٥» ----------
const east = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
export function formatRef(ref) {
  const r = typeof ref === 'string' ? parseRef(ref) : ref;
  const book = r.book.replace(/^(\d)\s/, (_, d) => `${east(d)} `);
  if (r.kind === 'cross') return `${book} ${east(r.from.chapter)}: ${east(r.from.verse)}–${east(r.to.chapter)}: ${east(r.to.verse)}`;
  if (r.kind === 'range') return `${book} ${east(r.chapter)}: ${east(r.from)}–${east(r.to)}`;
  return `${book} ${east(r.chapter)}: ${r.verses.map(east).join('، ')}`;
}

// ---------- ترقيم المزامير ----------
// ملف القطمارس متخزّن بترقيم فاندايك (العبري) عشان الشاب يفتح المزمور الصح.
// القطمارس المطبوع في الكنيسة بالترقيم السبعيني، فبنعرض رقمه جنب رقم فاندايك لما يختلفوا.
export function lxxToHebrew(chapter, verse = 1) {
  if (chapter <= 8 || chapter >= 148) return { chapter, verse };
  if (chapter === 9) return verse <= 21 ? { chapter: 9, verse } : { chapter: 10, verse: verse - 21 };
  if (chapter <= 112) return { chapter: chapter + 1, verse };
  if (chapter === 113) return verse <= 8 ? { chapter: 114, verse } : { chapter: 115, verse: verse - 8 };
  if (chapter === 114) return { chapter: 116, verse };
  if (chapter === 115) return { chapter: 116, verse: verse + 9 };
  if (chapter <= 145) return { chapter: chapter + 1, verse };
  if (chapter === 146) return { chapter: 147, verse };
  return { chapter: 147, verse: verse + 11 };
}
export function hebrewToLxxChapter(chapter, verse = 1) {
  if (chapter <= 8 || chapter >= 148) return chapter;
  if (chapter === 9 || chapter === 10) return 9;
  if (chapter <= 113) return chapter - 1;
  if (chapter === 114 || chapter === 115) return 113;
  if (chapter === 116) return verse <= 9 ? 114 : 115;
  if (chapter <= 146) return chapter - 1;
  return verse <= 11 ? 146 : 147;   // ١٤٧ عبري
}

// العرض للشاب: «مزامير ٦٥: ١١–١٢ (٦٤ في القطمارس)»
export function displayRef(ref) {
  const r = parseRef(ref);
  if (r.book !== 'مزامير') return formatRef(r);
  const ch = r.kind === 'cross' ? r.from.chapter : r.chapter;
  const v = r.kind === 'range' ? r.from : r.kind === 'list' ? r.verses[0] : r.from.verse;
  const lxx = hebrewToLxxChapter(ch, v);
  return lxx === ch ? formatRef(r) : `${formatRef(r)} (${east(lxx)} في القطمارس)`;
}

// ---------- قراءات تاريخ معيّن ----------
export function readingsFor(gYear, gMonth, gDay) {
  const t = today(gYear, gMonth, gDay);
  if (t.season !== 'annual') return { ...t, status: 'missing', why: `قطمارس ${t.season} لسه ما اتضافش` };
  const month = ANNUAL[t.coptic.month];
  if (!month) return { ...t, status: 'missing', why: `قطمارس شهر ${t.coptic.monthName} لسه ما اتضافش` };

  // الحد بياخد قراءات «الأحد رقم كذا من الشهر»، وباقي الأيام بتاخد قراءات اليوم القبطي.
  // ده الشكل العادي. تعارض الحد مع عيد سيدي أو عيد كبير لسه محتاج جدول القواعد.
  const isSunday = t.weekday === 0;
  const sundayIndex = Math.floor((t.coptic.day - 1) / 7) + 1;
  const entry = isSunday ? month.sundays[sundayIndex] : month.days[t.coptic.day];
  const readings = Object.fromEntries(SLOTS.map((s) => [s, entry[s]]));
  const flagged = month.flags
    .filter((f) => f.where.startsWith(isSunday ? `sundays.${sundayIndex}.` : `days.${t.coptic.day}.`))
    .map((f) => f.where.split('.').at(-1));

  return {
    ...t,
    status: month.reviewed ? 'reviewed' : 'unreviewed',
    title: isSunday ? entry.title : `${t.coptic.day} ${t.coptic.monthName}`,
    readings,
    display: Object.fromEntries(SLOTS.map((s) => [s, entry[s].map((r) => displayRef(r))])),
    flagged,   // خانات فيها شاهد محتاج مراجعة قبل العرض
  };
}
