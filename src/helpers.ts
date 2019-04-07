import { Scores } from 'src/App';
import { NGramRecord, Result } from 'src/interfaces';
import { ScoreSort, Word } from 'src/Words';

const ROLLING_AVERAGE = 100;

export const addResult = (record: NGramRecord, result: Result) => {
  record.times.push(result.time);
  record.correct.push(result.correct);

  // trim off our history to stay within our rolling average
  const excess = record.times.length - ROLLING_AVERAGE;
  if (excess > 0) {
    record.times = record.times.slice(excess);
    record.correct = record.correct.slice(excess);
  }

  // compute our new average speed
  const totalTime = record.times.reduce((a: number, b: number) => a + b);
  record.speed = totalTime / record.times.length;

  const totalCorrect = record.correct.filter((a: boolean) => a).length;
  record.accuracy = totalCorrect / record.correct.length;
  calculateScore(record);
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

export const calculateScoreSort = (scores: Scores): ScoreSort[] => {
  // tslint:disable-next-line: no-console
  let sortedScores: ScoreSort[] = [];
  // if we have some scores, let's look for problems
  if (scores) {
    sortedScores = Object.keys(scores)
      .map((key: string) => {
        const gramScore = scores[key];
        return { gram: gramScore.gram, score: gramScore.score };
      })
      .sort((a: ScoreSort, b: ScoreSort) => {
        if (a.gram.length < 2) {
          return 1;
        } else if (b.gram.length < 2) {
          return -1;
        } else {
          return b.score - a.score;
        }
      })
      .slice(0, 100);
  }

  return sortedScores;
};
