const TARGET_WPM = 85;
const TARGET_ACCURACY = 95;
const ROLLING_AVERAGE = 20;
const HIGH_FREQ_BIAS = 0.75; // % chance of getting a high frequency gram
const IDLE_THRESHOLD = 5000; // millis of idle to ignore results
const NGRAM_COMPONENT = 0.5; // ngram should be at least this % of a word
const START_SPRINT_LENGTH = 25; // starting characters for a sprint
const HISTORY_BIAS = 0.75; // % of words that consider your history
const SCORE_LIFESPAN = 10; // number of sprints before evaluating next problem set

export const TARGET_RECORDS = 20;
export const HIGH_FREQ_CUTTOFF = 0.35; // % of grams considered high frequency
export const HISTORY_SPREAD = 2; // top x historical scores to consider
export const MAX_SPRINT_LENGTH = 45; // max characters our sprints can ever be

export const getDefaultConfig = (): Config => {
  return {
    targetWPM: TARGET_WPM,
    targetAccuracy: TARGET_ACCURACY,
    rollingAverage: ROLLING_AVERAGE,
    highFrequencyBias: HIGH_FREQ_BIAS,
    idleThreshold: IDLE_THRESHOLD,
    ngramComponent: NGRAM_COMPONENT,
    sprintLength: START_SPRINT_LENGTH,
    historyBias: HISTORY_BIAS,
    scoreLifespan: SCORE_LIFESPAN,
    punishment: false
  };
};

export interface Config {
  targetWPM: number;
  targetAccuracy: number;
  rollingAverage: number;
  highFrequencyBias: number;
  idleThreshold: number;
  ngramComponent: number;
  sprintLength: number;
  historyBias: number;
  scoreLifespan: number;
  punishment: boolean;
}
