/**
 * ASL Dictionary
 *
 * Maps English words → GIF file paths in /public/signs/
 *
 * HOW TO ADD MORE WORDS:
 *   1. Drop the .gif file into public/signs/words/
 *   2. Add a line here:  yourword: '/signs/words/yourword.gif'
 *
 * If a word has no GIF, it automatically falls back to fingerspelling (letter by letter)
 */

// ─── Alphabet (A–Z fingerspelling) ───────────────────────────────────────────
export const LETTERS = {
  a: '/signs/letters/a.gif',
  b: '/signs/letters/b.gif',
  c: '/signs/letters/c.gif',
  d: '/signs/letters/d.gif',
  e: '/signs/letters/e.gif',
  f: '/signs/letters/f.gif',
  g: '/signs/letters/g.gif',
  h: '/signs/letters/h.gif',
  i: '/signs/letters/i.gif',
  j: '/signs/letters/j.gif',
  k: '/signs/letters/k.gif',
  l: '/signs/letters/l.gif',
  m: '/signs/letters/m.gif',
  n: '/signs/letters/n.gif',
  o: '/signs/letters/o.gif',
  p: '/signs/letters/p.gif',
  q: '/signs/letters/q.gif',
  r: '/signs/letters/r.gif',
  s: '/signs/letters/s.gif',
  t: '/signs/letters/t.gif',
  u: '/signs/letters/u.gif',
  v: '/signs/letters/v.gif',
  w: '/signs/letters/w.gif',
  x: '/signs/letters/x.gif',
  y: '/signs/letters/y.gif',
  z: '/signs/letters/z.gif',
};

// ─── Common words ─────────────────────────────────────────────────────────────
// Add/remove entries here as you collect GIF files
export const WORDS = {
  // Greetings
  hello:        '/signs/words/hello.gif',
  bye:          '/signs/words/bye.gif',
  goodbye:      '/signs/words/goodbye.gif',

  // Politeness
  please:       '/signs/words/please.gif',
  'thank you':  '/signs/words/thank-you.gif',
  thanks:       '/signs/words/thank-you.gif',
  sorry:        '/signs/words/sorry.gif',
  welcome:      '/signs/words/welcome.gif',

  // Yes / No
  yes:          '/signs/words/yes.gif',
  no:           '/signs/words/no.gif',

  // Basic verbs
  help:         '/signs/words/help.gif',
  want:         '/signs/words/want.gif',
  need:         '/signs/words/need.gif',
  go:           '/signs/words/go.gif',
  come:         '/signs/words/come.gif',
  stop:         '/signs/words/stop.gif',
  wait:         '/signs/words/wait.gif',
  understand:   '/signs/words/understand.gif',
  know:         '/signs/words/know.gif',
  like:         '/signs/words/like.gif',
  love:         '/signs/words/love.gif',

  // Food & drink
  eat:          '/signs/words/eat.gif',
  drink:        '/signs/words/drink.gif',
  water:        '/signs/words/water.gif',
  food:         '/signs/words/food.gif',
  hungry:       '/signs/words/hungry.gif',
  thirsty:      '/signs/words/thirsty.gif',

  // Places
  home:         '/signs/words/home.gif',
  school:       '/signs/words/school.gif',
  work:         '/signs/words/work.gif',
  bathroom:     '/signs/words/bathroom.gif',
  outside:      '/signs/words/outside.gif',

  // Descriptors
  good:         '/signs/words/good.gif',
  bad:          '/signs/words/bad.gif',
  hot:          '/signs/words/hot.gif',
  cold:         '/signs/words/cold.gif',
  big:          '/signs/words/big.gif',
  small:        '/signs/words/small.gif',
  more:         '/signs/words/more.gif',
  again:        '/signs/words/again.gif',
  finished:     '/signs/words/finished.gif',
  done:         '/signs/words/finished.gif',

  // Time
  today:        '/signs/words/today.gif',
  tomorrow:     '/signs/words/tomorrow.gif',
  yesterday:    '/signs/words/yesterday.gif',
  now:          '/signs/words/now.gif',
  later:        '/signs/words/later.gif',

  // People
  me:           '/signs/words/me.gif',
  you:          '/signs/words/you.gif',
  he:           '/signs/words/he.gif',
  she:          '/signs/words/she.gif',
  we:           '/signs/words/we.gif',
  they:         '/signs/words/they.gif',
  mother:       '/signs/words/mother.gif',
  father:       '/signs/words/father.gif',
  friend:       '/signs/words/friend.gif',

  // Colors
  red:          '/signs/words/red.gif',
  blue:         '/signs/words/blue.gif',
  green:        '/signs/words/green.gif',
  yellow:       '/signs/words/yellow.gif',
  black:        '/signs/words/black.gif',
  white:        '/signs/words/white.gif',

  // Numbers (words)
  one:          '/signs/words/1.gif',
  two:          '/signs/words/2.gif',
  three:        '/signs/words/3.gif',
  four:         '/signs/words/4.gif',
  five:         '/signs/words/5.gif',
};

// ─── Lookup function ──────────────────────────────────────────────────────────

/**
 * Given a word, returns either:
 *   { type: 'word', src: '/signs/words/hello.gif' }   ← has a full-word GIF
 *   { type: 'spell', letters: ['h','e','l','l','o'] } ← falls back to fingerspelling
 */
export function lookupSign(word) {
  const clean = word.toLowerCase().trim();

  if (WORDS[clean]) {
    return { type: 'word', src: WORDS[clean] };
  }

  // Fallback: fingerspell letter by letter
  const letters = clean.split('').filter(ch => LETTERS[ch]);
  return { type: 'spell', letters };
}

/**
 * Converts a full sentence into a sequence of sign assets to display.
 * Returns an array like:
 *   [
 *     { type: 'word',   src: '/signs/words/hello.gif',  word: 'hello' },
 *     { type: 'letter', src: '/signs/letters/w.gif',    word: 'w' },
 *     { type: 'letter', src: '/signs/letters/o.gif',    word: 'o' },
 *     ...
 *   ]
 */
export function sentenceToSigns(sentence) {
  const words = sentence.toLowerCase().trim().split(/\s+/);
  const sequence = [];

  for (const word of words) {
    const result = lookupSign(word);
    if (result.type === 'word') {
      sequence.push({ type: 'word', src: result.src, word });
    } else {
      for (const letter of result.letters) {
        sequence.push({ type: 'letter', src: LETTERS[letter], word: letter });
      }
    }
  }

  return sequence;
}
