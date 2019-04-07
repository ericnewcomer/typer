import './App.css';

import * as React from 'react';
import { TypeBox } from 'src/ components/typebox/TypeBox';
import { IDLE_THRESHOLD, SCORE_LIFESPAN } from 'src/config';
import { addResult, calculateScore, calculateScoreSort, recalculateScores, wordsToString } from 'src/helpers';
import Words, { ScoreSort, Word } from 'src/Words';

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
}

export interface Scores {
  [gram: string]: NGramRecord;
}

interface AppState {
  scores: Scores;
  wpm: number;
  currentSprint: string;
  currentWords?: Word[];
  scoreSort?: ScoreSort[];
  sprints: number;
}

class App extends React.Component<{}, AppState> {
  private words: Words;
  constructor(props: any) {
    super(props);

    this.words = new Words();

    const scores = JSON.parse(localStorage.getItem("scores") || "{}");
    recalculateScores(scores);
    const scoreSort = calculateScoreSort(scores);

    this.state = {
      scoreSort,
      sprints: 0,
      wpm: 0,
      scores,
      currentSprint: "welcome, type this to get started"
    };
  }

  public render() {
    return (
      <div className="App">
        <div className="wpm">{this.state.wpm > 0 ? this.state.wpm : ""}</div>
        <TypeBox
          sprint={this.state.currentSprint}
          words={this.state.currentWords}
          onComplete={this.handleSprintResults}
        />

        <div className="lesson">
          {(this.state.scoreSort || []).slice(0, 5).map((score: ScoreSort) => (
            <div className="lessongram" key={score.gram}>
              {score.gram}
            </div>
          ))}
        </div>
      </div>
    );
  }

  private handleSprintResults = (results: Result[], wpm: number) => {
    const scores = { ...this.state.scores };
    results.forEach((result: Result) => {
      // ignore excessive times
      if (result.time < IDLE_THRESHOLD) {
        this.addResult(scores, result);
      }
    });

    // tslint:disable-next-line: no-console
    console.log(Object.keys(scores).length + " records");

    const nextSprint = this.words.getNextSprint(this.state.scoreSort);

    const sprints = this.state.sprints + 1;
    let scoreSort: ScoreSort[] = this.state.scoreSort || [];
    if (sprints % SCORE_LIFESPAN === 0) {
      scoreSort = calculateScoreSort(scores);
    }

    this.setState(
      {
        sprints,
        scores,
        scoreSort,
        currentSprint: wordsToString(nextSprint),
        currentWords: nextSprint,
        wpm: wpm === 0 ? this.state.wpm : wpm
      },
      () => {
        // save our scores in the local storage
        localStorage.setItem("scores", JSON.stringify(this.state.scores));
      }
    );
  };

  private addResult(scores: Scores, result: Result): NGramRecord {
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
  }
}

export default App;
