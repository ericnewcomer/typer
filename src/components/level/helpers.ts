import { TARGET_RECORDS } from 'config';
import { getWPM } from 'helpers';
import { NGramRecord } from 'interfaces';
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
