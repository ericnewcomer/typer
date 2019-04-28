import Digits from 'components/digits/Digits';
import { calculateScoreSort, ScoreSort } from 'components/sandbox/helpers';
import { TypeBox } from 'components/typebox/TypeBox';
import { Config, HISTORY_SPREAD, SCORE_LIFESPAN } from 'config';
import { addResultToScores, wordsToString } from 'helpers';
import { Result, Scores, Word } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

import styles from './Sandbox.module.scss';

interface SandboxProps {
  config: Config;
  words: Words;
  scores: Scores;
  onScoresUpdated: (scores: Scores) => void;
}

interface SandboxState {
  scoreSort?: ScoreSort[];
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

    this.state = {
      sprints: 0,
      wpm: 0,
      currentSprint: "welcome, type this to get started"
    };
  }

  public render(): JSX.Element {
    return (
      <div>
        <div className={styles.wpm}>
          {this.state.wpm > 0 ? <Digits count={this.state.wpm} /> : ""}
        </div>
        <div className={styles.typebox}>
          <TypeBox
            sprint={this.state.currentSprint}
            words={this.state.currentWords}
            onComplete={this.handleSprintResults}
            onKeyPressed={this.handleKeyPressed}
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

  private handleKeyPressed = (key: string): boolean => {
    if (key === "?") {
      this.handleSprintResults([], 0);
      return true;
    }
    return false;
  };

  private handleSprintResults = (results: Result[], wpm: number) => {
    const scores = { ...this.props.scores };
    results.forEach((result: Result) => {
      // ignore excessive times
      if (result.time < this.props.config.idleThreshold) {
        addResultToScores(scores, result, this.props.config.rollingAverage);
      }
    });

    this.props.onScoresUpdated(scores);

    const sprints = this.state.sprints + 1;
    let scoreSort: ScoreSort[] = this.state.scoreSort || [];
    if (scoreSort.length === 0 || sprints % SCORE_LIFESPAN === 0) {
      scoreSort = calculateScoreSort(scores);
    }

    const nextSprint = this.props.words.getNextSprint(
      this.props.config.highFrequencyBias,
      scoreSort
    );

    this.setState({
      sprints,
      scoreSort,
      currentSprint: wordsToString(nextSprint),
      currentWords: nextSprint,
      wpm: wpm === 0 ? this.state.wpm : wpm
    });
  };
}
