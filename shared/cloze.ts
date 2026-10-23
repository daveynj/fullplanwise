/**
 * Fill-in-the-blank ("cloze") gap helpers, shared by the lesson generator
 * (tidies new lessons before they are saved) and the interactive exercise
 * (tidies and marks existing lessons as they are shown).
 *
 * Cloze text marks each gap as `[n:answer]`. Students drag a word-bank word
 * into a gap, so a gap can only be answered when its answer is a word-bank
 * word. The AI sometimes writes a changed form inside the brackets instead,
 * e.g. `[4:rescued]` while the word bank shows "rescue". Two layers fix that:
 *
 * 1. `tidyClozeText` rewrites such gaps so the brackets hold the word-bank
 *    word and the ending sits after them (`[4:rescue]d`), or moves text after
 *    the gap that belongs to the word-bank word into the brackets
 *    (`[1:wake] up` with "wake up" becomes `[1:wake up]`).
 * 2. `isClozeAnswerCorrect` accepts the word-bank word for gaps that cannot be
 *    rewritten that way (`[3:policies]` with "policy", `[2:wakes up]` with
 *    "wake up").
 *
 * A gap whose answer is already a word-bank word is never changed and only
 * accepts that word, so well-formed lessons behave exactly as before.
 */

const GAP_PATTERN = /\[(\d+):([^\]]+)\]/g;

/** Endings that make a regular form of a word: rescue → rescued, skip → skips. */
const INFLECTION_ENDINGS = new Set(["s", "es", "'s", "s'", "d", "ed", "ing", "er", "ers", "est"]);
/** Endings after a doubled final consonant: stop → stopped, big → bigger. */
const DOUBLED_CONSONANT_ENDINGS = new Set(["ed", "ing", "er", "ers", "est"]);
/** Word-building endings that may also sit after the brackets: careful → carefully. */
const DERIVED_ENDINGS = new Set(["ly", "ness", "ment", "ments", "ful", "able"]);

/**
 * Irregular forms, one base word per group: "base form form ...". Prefixed
 * verbs (understand, overcome, withdraw) are matched through their last part.
 */
const IRREGULAR_FORMS = new Map(
  (
    "arise arose arisen|awake awoke awoken|be am is are was were been|bear bore borne born|beat beaten|" +
    "become became|begin began begun|bend bent|bind bound|bite bit bitten|bleed bled|blow blew blown|" +
    "break broke broken|breed bred|bring brought|build built|burn burnt|buy bought|catch caught|" +
    "choose chose chosen|cling clung|come came|creep crept|deal dealt|dig dug|do did done|draw drew drawn|" +
    "dream dreamt|drink drank drunk|drive drove driven|dwell dwelt|eat ate eaten|fall fell fallen|feed fed|" +
    "feel felt|fight fought|find found|flee fled|fling flung|fly flew flown|forbid forbade forbidden|" +
    "forget forgot forgotten|forgive forgave forgiven|freeze froze frozen|get got gotten|give gave given|" +
    "go went gone|grind ground|grow grew grown|hang hung|have has had|hear heard|hide hid hidden|hold held|" +
    "keep kept|kneel knelt|know knew known|lay laid|lead led|lean leant|leap leapt|learn learnt|leave left|" +
    "lend lent|lie lay lain|light lit|lose lost|make made|mean meant|meet met|pay paid|prove proven|" +
    "ride rode ridden|ring rang rung|rise rose risen|run ran|say said|see saw seen|seek sought|sell sold|" +
    "send sent|sew sewn|shake shook shaken|shine shone|shoot shot|show shown|shrink shrank shrunk|" +
    "sing sang sung|sink sank sunk|sit sat|sleep slept|slide slid|speak spoke spoken|speed sped|spell spelt|" +
    "spend spent|spill spilt|spin spun|spring sprang sprung|stand stood|steal stole stolen|stick stuck|" +
    "sting stung|stink stank stunk|strike struck stricken|strive strove striven|swear swore sworn|" +
    "sweep swept|swell swollen|swim swam swum|swing swung|take took taken|teach taught|tear tore torn|" +
    "tell told|think thought|throw threw thrown|tread trod trodden|wake woke woken|wear wore worn|" +
    "weave wove woven|weep wept|win won|wind wound|write wrote written|" +
    "good better best|bad worse worst|far farther farthest further furthest|little less least|" +
    "many more most|much more most|man men|woman women|child children|person people|foot feet|" +
    "tooth teeth|goose geese|mouse mice|ox oxen"
  )
    .split("|")
    .map((group) => {
      const [base, ...forms] = group.split(" ");
      return [base, forms] as const;
    }),
);

/** Lower-cases and straightens curly apostrophes without changing the length. */
function fold(value: string): string {
  return value.toLowerCase().replace(/[\u2018\u2019]/g, "'");
}

/** Comparison form of a word or phrase: folded, trimmed, single spaces. */
function normalize(value: string): string {
  return fold(value).replace(/\s+/g, " ").trim();
}

/** "to touch base" in the word bank and "touch base" in a gap are the same entry. */
function withoutInfinitiveTo(normalized: string): string {
  return normalized.startsWith("to ") ? normalized.slice(3) : normalized;
}

function sameEntry(a: string, b: string): boolean {
  return withoutInfinitiveTo(normalize(a)) === withoutInfinitiveTo(normalize(b));
}

function wordsOf(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

function bankEntries(wordBank: readonly unknown[] | null | undefined): string[] {
  if (!Array.isArray(wordBank)) return [];
  return wordBank
    .filter((word): word is string | number => typeof word === "string" || typeof word === "number")
    .map((word) => String(word).trim())
    .filter(Boolean);
}

/** A word-bank entry plus its form without a leading "to", as word lists. */
function entryWordLists(entry: string): string[][] {
  const full = normalize(entry);
  const short = withoutInfinitiveTo(full);
  return short === full ? [wordsOf(full)] : [wordsOf(full), wordsOf(short)];
}

function isInflectionEnding(base: string, ending: string): boolean {
  if (INFLECTION_ENDINGS.has(ending)) return true;
  const last = base.slice(-1);
  // stop → stopped, plan → planning, big → bigger
  if (/[bcdfghjklmnpqrstvz]/.test(last) && ending[0] === last && DOUBLED_CONSONANT_ENDINGS.has(ending.slice(1))) {
    return true;
  }
  // panic → panicked
  return last === "c" && ["ked", "king", "ker"].includes(ending);
}

/**
 * Whether `rest` can follow a word-bank word outside the brackets: an ending
 * ("d", "ing"), extra words (" in"), or an ending then extra words ("ed in").
 */
function isSplittableEnding(base: string, rest: string): boolean {
  const ending = /^[\p{L}']*/u.exec(rest)![0];
  const extraWords = rest.slice(ending.length);
  if (extraWords && !/^\s+\S/.test(extraWords)) return false;
  if (!ending) return extraWords.length > 0;
  return isInflectionEnding(base, ending) || DERIVED_ENDINGS.has(ending);
}

function isIrregularFormOf(word: string, base: string): boolean {
  if (IRREGULAR_FORMS.get(base)?.includes(word)) return true;
  // understand → understood, overcome → overcame, withdraw → withdrew
  for (const [irregularBase, forms] of IRREGULAR_FORMS) {
    const prefixLength = base.length - irregularBase.length;
    if (prefixLength < 2 || !base.endsWith(irregularBase)) continue;
    const prefix = base.slice(0, prefixLength);
    if (word.startsWith(prefix) && forms.includes(word.slice(prefixLength))) return true;
  }
  return false;
}

/** Whether single word `word` is a grammatical form of single word `base`. */
function isWordFormOf(word: string, base: string): boolean {
  if (word === base) return true;
  if (base.length < 2) return false;
  if (word.startsWith(base) && isInflectionEnding(base, word.slice(base.length))) return true;

  const stem = base.slice(0, -1);
  const stemEnding = word.startsWith(stem) ? word.slice(stem.length) : null;
  // mingle → mingling, simple → simpler
  if (/[^aeiou]e$/.test(base) && stemEnding && ["ing", "ed", "er", "ers", "est", "able"].includes(stemEnding)) {
    return true;
  }
  // policy → policies, study → studied, happy → happily
  if (/[^aeiou]y$/.test(base) && stemEnding && ["ies", "ied", "ier", "iers", "iest", "ily", "iness"].includes(stemEnding)) {
    return true;
  }
  // lie → lying
  if (base.endsWith("ie") && word === `${base.slice(0, -2)}ying`) return true;
  // leaf → leaves, knife → knives
  if (base.endsWith("fe") && word === `${base.slice(0, -2)}ves`) return true;
  if (base.endsWith("f") && word === `${stem}ves`) return true;
  // crisis → crises, stimulus → stimuli, medium → media, criterion → criteria
  if (base.endsWith("is") && word === `${base.slice(0, -2)}es`) return true;
  if (base.endsWith("us") && word === `${base.slice(0, -2)}i`) return true;
  if ((base.endsWith("um") || base.endsWith("on")) && word === `${base.slice(0, -2)}a`) return true;

  return isIrregularFormOf(word, base);
}

/** Two words are forms of each other: "rescued"/"rescue", "trait"/"traits", "fell"/"fall". */
function sameWordFamily(a: string, b: string): boolean {
  return isWordFormOf(a, b) || isWordFormOf(b, a);
}

interface Candidate {
  /** The word-bank entry as written. */
  entry: string;
  /** Comparison form of the entry, used to tell different entries apart. */
  key: string;
  /** Lower is a closer match. */
  rank: number;
  /** Number of words matched; more is more specific. */
  words: number;
}

/**
 * Picks the closest word-bank match. When different entries match equally
 * well, the longer one wins only if it contains the others ("teacher" over
 * "teach" for "teachers"); otherwise the result is ambiguous and null.
 */
function pickCandidate<T extends Candidate>(candidates: T[]): T | null {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort(
    (a, b) => a.rank - b.rank || b.words - a.words || b.key.length - a.key.length,
  );
  const [best] = sorted;
  const rivals = sorted.filter((c) => c.rank === best.rank && c.words === best.words && c.key !== best.key);
  return rivals.every((c) => best.key.startsWith(c.key)) ? best : null;
}

/**
 * Finds the word-bank entry that a gap answer matches or is a form of.
 * Preference: the same words, then the whole answer as a form of the entry
 * ("wakes up" → "wake up"), then the entry plus an ending or extra words
 * ("rescued" → "rescue", "plug in" → "plug"), then the start of a longer entry
 * ("steeped" → "steeped in"). Returns null when nothing fits or two different
 * entries fit equally well.
 */
export function findWordBankMatch(answer: string, wordBank: readonly unknown[]): string | null {
  const candidates: Candidate[] = [];

  for (const alternative of answer.split("|")) {
    const answerText = withoutInfinitiveTo(normalize(alternative));
    const answerWords = wordsOf(answerText);
    if (!answerWords.length) continue;

    for (const entry of bankEntries(wordBank)) {
      const key = withoutInfinitiveTo(normalize(entry));
      for (const entryWords of entryWordLists(entry)) {
        const entryText = entryWords.join(" ");
        const wordsMatch = (count: number) =>
          answerWords.slice(0, count).every((word, i) => sameWordFamily(word, entryWords[i]));

        let rank: number | null = null;
        if (answerText === entryText) {
          rank = 0;
        } else if (answerWords.length === entryWords.length && wordsMatch(entryWords.length)) {
          rank = 1;
        } else if (
          entryText.length >= 2 &&
          answerText.startsWith(entryText) &&
          isSplittableEnding(entryText, answerText.slice(entryText.length))
        ) {
          rank = 2;
        } else if (answerWords.length < entryWords.length && wordsMatch(answerWords.length)) {
          rank = 3;
        }
        if (rank !== null) candidates.push({ entry, key, rank, words: entryWords.length });
      }
    }
  }

  return pickCandidate(candidates)?.entry ?? null;
}

/**
 * Whether the word a student placed in a gap is correct. Exact matches (case
 * and spacing aside) always count. When the gap's answer is not a word-bank
 * word, the word-bank word it is a form of counts too.
 */
export function isClozeAnswerCorrect(userAnswer: string, answer: string, wordBank: readonly unknown[]): boolean {
  if (!userAnswer.trim()) return false;
  const alternatives = answer.split("|").filter((alternative) => alternative.trim());
  if (alternatives.some((alternative) => sameEntry(userAnswer, alternative))) return true;

  const bank = bankEntries(wordBank);
  // A gap whose answer is in the word bank only accepts that word.
  if (alternatives.some((alternative) => bank.some((entry) => sameEntry(entry, alternative)))) return false;

  const match = findWordBankMatch(answer, bank);
  return match !== null && sameEntry(userAnswer, match);
}

interface GapRewrite {
  inner: string;
  after: string;
}

/** `[4:rescued]` with "rescue" → `[4:rescue]d`, `[6:plug in]` with "plug" → `[6:plug] in`. */
function splitOffEnding(inner: string, entry: string): GapRewrite | null {
  const entryText = normalize(entry);
  const folded = fold(inner);
  if (entryText.length < 2 || !folded.startsWith(entryText)) return null;
  if (!isSplittableEnding(entryText, folded.slice(entryText.length))) return null;
  return { inner: inner.slice(0, entryText.length), after: inner.slice(entryText.length) };
}

/** Words at the start of `text` that are separated only by spaces. */
function leadingWords(text: string, max: number): { word: string; end: number }[] {
  const wordPattern = /[\p{L}\p{M}\p{N}'\u2019-]+/uy;
  const spacePattern = /\s+/y;
  const words: { word: string; end: number }[] = [];
  let index = 0;
  while (words.length < max) {
    if (words.length > 0) {
      spacePattern.lastIndex = index;
      if (!spacePattern.exec(text)) break;
      index = spacePattern.lastIndex;
    }
    wordPattern.lastIndex = index;
    const match = wordPattern.exec(text);
    if (!match) break;
    index = wordPattern.lastIndex;
    words.push({ word: match[0], end: index });
  }
  return words;
}

/**
 * Moves text after the gap that belongs to a word-bank word into the
 * brackets: `[2:emission]s` → `[2:emissions]`, `[1:roll] out` → `[1:roll out]`,
 * `[1:forage]ing` → `[1:foraging]`, `[2:wake]s up` → `[2:wakes up]`.
 */
function absorbFollowingText(inner: string, after: string, bank: string[]): GapRewrite | null {
  const attached = /^(?:[\p{L}\p{M}]|['\u2019](?=\p{L}))*/u.exec(after)![0];

  // The sentence text starting at the gap. When an ending is attached to the
  // brackets, also try the spelling the joined word should have.
  const readings = [{ text: inner + after, innerLength: inner.length }];
  if (attached) {
    const innerFolded = fold(inner);
    const attachedFolded = fold(attached);
    if (/[^aeiou]e$/.test(innerFolded) && /^[aeiouy]/.test(attachedFolded)) {
      readings.push({ text: inner.slice(0, -1) + after, innerLength: inner.length - 1 }); // forage + ing
    } else if (/[^aeiou]y$/.test(innerFolded) && attachedFolded.startsWith("i")) {
      readings.push({ text: inner.slice(0, -1) + after, innerLength: inner.length - 1 }); // policy + ies
    } else if (/[^aeiou]y$/.test(innerFolded) && attachedFolded.startsWith("e")) {
      readings.push({ text: `${inner.slice(0, -1)}i${after}`, innerLength: inner.length }); // study + ed
    }
  }

  const candidates: (Candidate & { entryText: string; text: string; end: number; changed: boolean })[] = [];

  for (const entry of bank) {
    const key = withoutInfinitiveTo(normalize(entry));
    for (const entryWords of entryWordLists(entry)) {
      for (const [readingIndex, reading] of readings.entries()) {
        const words = leadingWords(reading.text, entryWords.length).map((w) => ({ ...w, word: normalize(w.word) }));
        if (words.length < entryWords.length) continue;
        if (!words.every(({ word }, i) => sameWordFamily(word, entryWords[i]))) continue;
        const end = words[words.length - 1].end;
        // The match must cover the whole gap answer.
        if (end < reading.innerLength) continue;

        candidates.push({
          entry,
          key,
          rank: words.every(({ word }, i) => word === entryWords[i]) ? 0 : 1,
          words: entryWords.length,
          entryText: entryWords.join(" "),
          text: reading.text,
          end,
          changed: readingIndex > 0 || end > inner.length,
        });
        break;
      }
    }
  }

  const best = pickCandidate(candidates);
  if (!best || !best.changed) return null;

  const span = best.text.slice(0, best.end);
  const rest = best.text.slice(best.end);
  // [3:celebrat]ed → [3:celebrated] → [3:celebrate]d
  const spanFolded = fold(span);
  if (spanFolded.startsWith(best.entryText) && isSplittableEnding(best.entryText, spanFolded.slice(best.entryText.length))) {
    return { inner: span.slice(0, best.entryText.length), after: span.slice(best.entryText.length) + rest };
  }
  return { inner: span, after: rest };
}

function tidyGap(inner: string, after: string, bank: string[]): GapRewrite | null {
  const trimmed = inner.trim();
  // Alternatives ("memory|memories") are left to isClozeAnswerCorrect.
  if (!trimmed || trimmed.includes("|")) return null;
  if (bank.some((entry) => sameEntry(entry, trimmed))) return null;

  // Split only for the word-bank word the whole answer matches best. With
  // "wake" and "wake up" in the bank, "[1:wakes up]" must keep accepting
  // "wake up" instead of becoming "[1:wake]s up".
  const match = findWordBankMatch(trimmed, bank);
  const split = match ? splitOffEnding(trimmed, match) : null;
  if (split) return { inner: split.inner, after: split.after + after };
  return absorbFollowingText(trimmed, after, bank);
}

/**
 * Rewrites gaps whose answer is a changed form of a word-bank word so the
 * brackets hold the word-bank word and the rest of the sentence still reads
 * the same: `[4:rescued]` → `[4:rescue]d`, `[3:steeped] in` with "steeped in"
 * → `[3:steeped in]`. Gaps that already match the word bank, and gaps with no
 * related word-bank word, are left exactly as they are.
 */
export function tidyClozeText(text: string, wordBank: readonly unknown[]): string {
  const bank = bankEntries(wordBank);
  if (!bank.length || typeof text !== "string") return text;

  const gaps = Array.from(text.matchAll(GAP_PATTERN));
  let result = text.slice(0, gaps[0]?.index ?? text.length);
  gaps.forEach((gap, i) => {
    const gapEnd = gap.index! + gap[0].length;
    const after = text.slice(gapEnd, gaps[i + 1]?.index ?? text.length);
    const rewrite = tidyGap(gap[2], after, bank);
    result += rewrite ? `[${gap[1]}:${rewrite.inner}]${rewrite.after}` : gap[0] + after;
  });
  return result;
}

/**
 * Gaps (as written, e.g. "[1:___]") that no word-bank word can answer, even
 * allowing for changed word forms.
 */
export function findUnanswerableClozeGaps(text: string, wordBank: readonly unknown[]): string[] {
  if (typeof text !== "string") return [];
  const bank = bankEntries(wordBank);
  return Array.from(text.matchAll(GAP_PATTERN))
    .filter(([, , answer]) => !bank.some((entry) => isClozeAnswerCorrect(entry, answer, bank)))
    .map(([gap]) => gap);
}
