import { Config, TARGET_RECORDS } from 'config';
import { getWPM } from 'helpers';
import { NGramRecord, Scores, Word } from 'interfaces';
import Words from 'Words';

export const NGRAMS_PER_LEVEL = 2;
const INTRODUCE_TRIGRAMS = 20;
const TRIGRAMS_EVERY = 3;

export const getAllNGrams = (words: Words, level: number): string[] => {
  const ngrams: string[] = [];
  for (let i = 0; i <= level; i++) {
    ngrams.push(...getGramsForLevel(words, i));
  }
  return ngrams;
};

export const getIncompleteGrams = (
  words: Words,
  level: number,
  scores: Scores,
  config: Config
): string[] => {
  let incompleteGrams: string[] = [];

  let stepLevel = 0;
  while (incompleteGrams.length < NGRAMS_PER_LEVEL && stepLevel <= level) {
    incompleteGrams.push(
      ...getIncompleteGramsForLevel(words, stepLevel, scores, config)
    );
    stepLevel++;
  }

  // still none, give use our completed ngrams at this level
  if (incompleteGrams.length === 0) {
    return getGramsForLevel(words, level);
  }

  return incompleteGrams.slice(incompleteGrams.length - 2);
};

export const getIncompleteGramsForLevel = (
  words: Words,
  level: number,
  scores: Scores,
  config: Config
): string[] => {
  // filter out any grams we've already completed
  return getGramsForLevel(words, level).filter((gram: string) => {
    const result = scores[gram];
    if (!result) {
      return true;
    }
    return (
      result &&
      getPercentComplete(config.targetWPM, config.targetAccuracy, result) < 100
    );
  });
};

export const getGramsForLevel = (words: Words, level: number): string[] => {
  // console.log(level);
  if (
    level >= INTRODUCE_TRIGRAMS &&
    (level - INTRODUCE_TRIGRAMS) % TRIGRAMS_EVERY === 0
  ) {
    level -= INTRODUCE_TRIGRAMS;

    const diff = level / TRIGRAMS_EVERY;
    level -= diff;
    level /= TRIGRAMS_EVERY - 1;
    level = Math.floor(level);

    // tslint:disable-next-line: no-console
    // console.log("trigrams", level);

    const trigramStart = level * NGRAMS_PER_LEVEL;
    const trigramEnd = trigramStart + NGRAMS_PER_LEVEL;
    const grams = words.getTrigrams().ngrams.slice(trigramStart, trigramEnd);

    // console.log(grams);
    return grams;
  }

  if (level > INTRODUCE_TRIGRAMS) {
    const trigramsShown =
      Math.floor((level - INTRODUCE_TRIGRAMS) / TRIGRAMS_EVERY) + 1;

    level -= trigramsShown;

    // console.log("shown:", trigramsShown);
  }

  // tslint:disable-next-line: no-console
  // console.log("bigrams", level);

  const start = level * NGRAMS_PER_LEVEL;
  const end = start + NGRAMS_PER_LEVEL;
  const grams = words.getBigrams().ngrams.slice(start, end);

  // console.log(grams);
  return grams;
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
      word.pct = record
        ? getPercentComplete(targetSpeed, targetAccuracy, record)
        : 0;
    }
  });
};

/*export const getSeverityColor = (pct: number) => {
  var hue = (Math.max(pct / 10 - 9, 0) * 120).toString(10);
  return ["hsl(" + hue + ",64%,68%)"].join("");
};*/

var percentColors = [
  { pct: 0, color: { r: 0x71, g: 0xc0, b: 0xe8 } },
  { pct: 0.9, color: { r: 0x71, g: 0xc0, b: 0xe8 } },
  { pct: 0.9999, color: { r: 0x00, g: 0x76, b: 0xb2 } },
  { pct: 1, color: { r: 0x6e, g: 0xb5, b: 0x58 } }
];

export const getSeverityColor = (pct: number, adjustment: number = 1) => {
  // console.log("o", pct);
  // pct = (pct - 80) / 20;
  // pct = Math.max(0, pct);
  // console.log("a", pct);

  pct /= 100;

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
    r: Math.floor(
      lower.color.r * pctLower + upper.color.r * pctUpper * adjustment
    ),
    g: Math.floor(
      lower.color.g * pctLower + upper.color.g * pctUpper * adjustment
    ),
    b: Math.floor(
      lower.color.b * pctLower + upper.color.b * pctUpper * adjustment
    )
  };
  return "rgb(" + [color.r, color.g, color.b].join(",") + ")";
};
