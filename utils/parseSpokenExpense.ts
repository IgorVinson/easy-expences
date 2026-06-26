import { findBestNameMatch } from './voiceMatch';

// On-device parser: turns a spoken transcript like "food five bucks" into the
// three form fields (title, amount, category) without any network/LLM call.
// Amounts spoken as digits ("5", "5.50") are preferred; spoken English number
// words ("five", "twenty five", "one hundred") are handled as a fallback.

export interface ParsedSpokenExpense {
  title: string;
  amount: number;
  category: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};

// Words to strip out of the title (currency + filler around the amount).
const NOISE_WORDS = new Set([
  'buck', 'bucks', 'dollar', 'dollars', 'cent', 'cents', 'euro', 'euros',
  'pound', 'pounds', 'usd', 'eur', 'and', 'for', 'on', 'of', 'a', 'an',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.,\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Convert a run of consecutive English number words into a single value.
function wordsToNumber(tokens: string[]): number | null {
  let total = 0;
  let current = 0;
  let matched = false;
  for (const tok of tokens) {
    const val = NUMBER_WORDS[tok];
    if (val === undefined) {
      if (matched) break; // run of number words ended
      continue;
    }
    matched = true;
    if (val === 100) {
      current = (current || 1) * 100;
    } else if (val === 1000) {
      total += (current || 1) * 1000;
      current = 0;
    } else {
      current += val;
    }
  }
  return matched ? total + current : null;
}

function extractAmount(text: string): number {
  // Prefer an explicit digit amount.
  const digitMatch = text.match(/\d+(?:[.,]\d{1,2})?/);
  if (digitMatch) {
    const value = Number(digitMatch[0].replace(',', '.'));
    if (!Number.isNaN(value) && value > 0) return value;
  }
  // Fall back to spoken English number words.
  const fromWords = wordsToNumber(tokenize(text));
  return fromWords && fromWords > 0 ? fromWords : 0;
}

function buildTitle(text: string, fallback: string): string {
  const cleaned = tokenize(text)
    .filter((tok) => !/\d/.test(tok)) // drop digit tokens
    .filter((tok) => NUMBER_WORDS[tok] === undefined) // drop number words
    .filter((tok) => !NOISE_WORDS.has(tok)) // drop currency/filler
    .join(' ')
    .trim();
  const title = cleaned || fallback;
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : '';
}

export function parseSpokenExpense<T extends { name: string }>(
  transcript: string,
  categories: T[]
): ParsedSpokenExpense {
  const text = (transcript ?? '').trim();
  const amount = extractAmount(text);
  const categoryMatch = findBestNameMatch(categories, text);
  const category = categoryMatch?.name ?? '';
  const title = buildTitle(text, category);
  return { title, amount, category };
}
