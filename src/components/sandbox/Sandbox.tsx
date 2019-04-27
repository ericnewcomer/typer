import { calculateScoreSort, ScoreSort } from 'components/sandbox/helpers';
import { TypeBox } from 'components/typebox/TypeBox';
import { HISTORY_SPREAD, IDLE_THRESHOLD, SCORE_LIFESPAN } from 'config';
import { addResultToScores, recalculateScores, wordsToString } from 'helpers';
import { Result, Scores, Word } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

import styles from './Sandbox.module.scss';

interface SandboxProps {
  words: Words;
}

interface SandboxState {
  scoreSort?: ScoreSort[];
  scores: Scores;
  wpm: number;
  currentSprint: string;
  currentWords?: Word[];
  sprints: number;
}

export default class Sandbox extends React.Component<
  SandboxProps,
  SandboxState
> {
  constructor(props: SandboxProps) {
    super(props);

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

  public render(): JSX.Element {
    return (
      <div>
        <div className={styles.wpm}>
          {this.state.wpm > 0 ? this.state.wpm : ""}
        </div>
        <div className={styles.typebox}>
          <TypeBox
            sprint={this.state.currentSprint}
            words={this.state.currentWords}
            onComplete={this.handleSprintResults}
          />
        </div>

        <div className={styles.current_grams}>
          {(this.state.scoreSort || [])
            .slice(0, HISTORY_SPREAD)
            .map((score: ScoreSort) => (
              <div className={styles.gram} key={score.gram}>
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
        addResultToScores(scores, result);
      }
    });

    // tslint:disable-next-line: no-console
    console.log(Object.keys(scores).length + " records");

    const sprints = this.state.sprints + 1;
    let scoreSort: ScoreSort[] = this.state.scoreSort || [];
    if (sprints % SCORE_LIFESPAN === 0) {
      scoreSort = calculateScoreSort(scores);
    }

    const nextSprint = this.props.words.getNextSprint(scoreSort);

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
}
