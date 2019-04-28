import { ROLLING_AVERAGE } from 'config';
import { NGramRecord, Result, Scores, Word } from 'interfaces';

export const getRandomItem = (list: any[]): any => {
  const idx = Math.floor(Math.random() * list.length);
  const rand = list[idx];
  // tslint:disable-next-line: no-console
  // console.log("Random item from ", list, idx, rand);

  return rand;
};

export const addResultToScores = (
  scores: Scores,
  result: Result
): NGramRecord => {
  let record: NGramRecord = scores[result.gram];

  // tslint:disable-next-line: no-console
  // console.log(result.gram, frequency);

  if (!record) {
    const accuracy = result.correct ? 1 : 0;
    const speed = result.time;

    record = {
      gramType: result.type,
      gram: result.gram,
      times: [result.time],
      correct: [result.correct],
      accuracy,
      speed,
      score: 0
    };
    calculateScore(record);

    scores[record.gram] = record;
  } else {
    addResult(record, result);
  }

  return record;
};

const addResult = (record: NGramRecord, result: Result) => {
  record.speed =
    (record.speed * record.times.length + result.time) /
    (record.times.length + 1);

  record.accuracy =
    (record.accuracy * record.correct.length + (result.correct ? 1 : 0)) /
    (record.correct.length + 1);

  record.times.push(result.time);
  record.correct.push(result.correct);

  // trim off our history to stay within our rolling average
  const excess = record.times.length - ROLLING_AVERAGE;
  if (excess > 0) {
    record.times = record.times.slice(excess);
    record.correct = record.correct.slice(excess);
  }

  // compute our new average speed
  // const totalTime = record.times.reduce((a: number, b: number) => a + b);
  // record.speed = totalTime / record.times.length;
  // const totalCorrect = record.correct.filter((a: boolean) => a).length;
  // record.accuracy = totalCorrect / record.correct.length;

  calculateScore(record);
};

export const getWPM = (result: NGramRecord) => {
  return Math.floor(((result.gram.length / result.speed) * 1000 * 60) / 5);
};

export const recalculateScores = (scores: Scores) => {
  Object.keys(scores).forEach((key: string) => {
    calculateScore(scores[key]);
  });
};

/**
 * Calculates a score to decide problem areas, the higher the
 * score the bigger a problem it is. Problems with infrequent
 * patterns are reduced since they aren't as important.
 */
export const calculateScore = (record: NGramRecord) => {
  const pctMissed = 1 - record.accuracy;
  const charSpeed = record.speed / record.gram.length;
  record.score = charSpeed + charSpeed * pctMissed;
};

export const wordsToString = (word: Word[]): string => {
  return word.map((w: Word) => w.text).join(" ");
};

export const wordsLength = (word: Word[]): number => {
  return wordsToString(word).length;
};

export const wordsCharAt = (word: Word[], index: number) => {
  return wordsToString(word).charAt(index);
};

export const wordsSubstr = (word: Word[], start: number, end?: number) => {
  return wordsToString(word).substr(start, end);
};

export const isInsideGram = (words: Word[], index: number) => {
  let sentencePos = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (i < sentencePos + word.text.length) {
      const letterPos = index - sentencePos;
      if (word.ngram) {
        const ngramStart = word.text.indexOf(word.ngram);
        const ngramEnd = ngramStart + word.ngram.length;

        if (letterPos >= ngramStart && letterPos < ngramEnd) {
          return true;
        }
      }
    }

    sentencePos += word.text.length + 1; // account for space
  }
  return false;
};

export const hasWord = (words: Word[], word: Word) =>
  !!words.find((w: Word) => isWordMatch(word, w));

const isWordMatch = (a: Word, b: Word) => a.text === b.text;

export const getWordsForNGram = (
  words: Word[],
  candidates: Word[],
  ngram: string,
  pctOfWord: number,
  charsNeeded: number
): Word[] => {
  return words.filter((w: Word) => {
    return (
      w.text.indexOf(ngram) > -1 &&
      w.text.length <= charsNeeded &&
      !hasWord(candidates, w) &&
      ngram.length / w.text.length >= pctOfWord
    );
  });
};
