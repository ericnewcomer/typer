import { TARGET_RECORDS } from 'config';
import { getWPM } from 'helpers';
import { NGramRecord, Scores, Word } from 'interfaces';
import Words from 'Words';

const NGRAMS_PER_LEVEL = 2;
const INTRODUCE_TRIGRAMS = 20;
const TRIGRAMS_EVERY = 3;

export const getNGramsForLevel = (words: Words, level: number): string[] => {
  if (level >= INTRODUCE_TRIGRAMS && level % TRIGRAMS_EVERY === 0) {
    level -= INTRODUCE_TRIGRAMS;

    const diff = level / TRIGRAMS_EVERY;
    level -= diff;
    level /= TRIGRAMS_EVERY - 1;
    level = Math.floor(level);

    // tslint:disable-next-line: no-console
    // console.log("trigrams", level);

    const trigramStart = level * NGRAMS_PER_LEVEL;
    const trigramEnd = trigramStart + NGRAMS_PER_LEVEL;
    return words.getTrigrams().ngrams.slice(trigramStart, trigramEnd);
  }

  if (level > INTRODUCE_TRIGRAMS) {
    const trigramsShown = Math.floor(
      (level - INTRODUCE_TRIGRAMS) / TRIGRAMS_EVERY
    );

    level -= trigramsShown;
  }

  // tslint:disable-next-line: no-console
  // console.log("bigrams", level);

  const start = level * NGRAMS_PER_LEVEL;
  const end = start + NGRAMS_PER_LEVEL;
  return words.getBigrams().ngrams.slice(start, end);
};

export const getPercentComplete = (
  targetSpeed: number,
  targetAccuracy: number,
  record: NGramRecord
) => {
  // target speet is 3/4 for double letters
  if (record.gram.length === 2 && record.gram[0] === record.gram[1]) {
    targetSpeed *= 0.75;
  }

  const speedScore = Math.min(
    100,
    Math.floor((100 * getWPM(record)) / targetSpeed)
  );
  const accuracyScore = Math.min(
    100,
    Math.floor((100 * (100 * record.accuracy)) / targetAccuracy)
  );

  const avgScore = (speedScore + accuracyScore) / 2;

  // need at least twenty records to finish
  return (
    avgScore - TARGET_RECORDS + Math.min(TARGET_RECORDS, record.times.length)
  );
};

export const addNGramScores = (
  targetSpeed: number,
  targetAccuracy: number,
  words: Word[],
  scores: Scores
) => {
  words.forEach((word: Word) => {
    if (word.ngram) {
      const record = scores[word.ngram];
      if (record) {
        word.pct = getPercentComplete(targetSpeed, targetAccuracy, record);
      }
    }
  });
};

/*export const getSeverityColor = (pct: number) => {
  var hue = (Math.max(pct / 10 - 9, 0) * 120).toString(10);
  return ["hsl(" + hue + ",64%,68%)"].join("");
};*/

var percentColors = [
  // { pct: 0.0, color: { r: 0xe5, g: 0x26, b: 0x20 } },
  // { pct: 0.0, color: { r: 0xa8, g: 0x71, b: 0xc6 } },
  // { pct: 1.0, color: { r: 0x1c, g: 0x83, b: 0xd8 } },

  // { pct: 0.3, color: { r: 0xf2, g: 0x91, b: 0x09 } },

  // blue to green
  // { pct: 0, color: { r: 0x22, g: 0x5d, b: 0xe8 } },
  // { pct: 1.0, color: { r: 0x0c, g: 0x96, b: 0x15 } }

  { pct: 0, color: { r: 0xff, g: 0xb6, b: 0x00 } },
  // { pct: 0.5, color: { r: 0xc3, g: 0xff, b: 0x00 } },
  { pct: 1.0, color: { r: 0x0c, g: 0x96, b: 0x15 } }
];

export const getSeverityColor = (pct: number) => {
  pct = pct / 10 - 9;
  pct = Math.max(0, pct);

  for (var i = 1; i < percentColors.length - 1; i++) {
    if (pct < percentColors[i].pct) {
      break;
    }
  }
  const lower = percentColors[i - 1];
  const upper = percentColors[i];
  const range = upper.pct - lower.pct;
  const rangePct = (pct - lower.pct) / range;
  const pctLower = 1 - rangePct;
  const pctUpper = rangePct;
  const color = {
    r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
    g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
    b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
  };
  return "rgb(" + [color.r, color.g, color.b].join(",") + ")";
};
