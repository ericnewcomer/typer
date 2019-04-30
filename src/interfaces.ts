export type Nullable<T> = T | null;
export type Undefinable<T> = T | undefined;

export interface Scores {
  [gram: string]: NGramRecord;
}

export interface NGramRecord {
  gramType: NGramType;
  gram: string;
  times: number[];
  correct: boolean[];

  accuracy: number;
  speed: number;
  score: number;
}

export enum NGramType {
  unigram = 1,
  bigram = 2,
  trigram = 3,
  quadrigram = 4
}

export interface Result {
  type: NGramType;
  gram: string;
  time: number;
  correct: boolean;
  word?: Word;
}

export interface Word {
  rank: number;
  text: string;
  pos: string;
  dispersion: number;
  ngram?: string;
  pct?: number;
}
