import { Scores } from 'interfaces';

export interface ScoreSort {
  gram: string;
  score: number;
}

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
