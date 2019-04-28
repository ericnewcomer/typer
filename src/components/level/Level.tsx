import Digits from 'components/digits/Digits';
import { getNGramsForLevel, getPercentComplete } from 'components/level/helpers';
import { TypeBox } from 'components/typebox/TypeBox';
import { IDLE_THRESHOLD, MAX_SPRINT_LENGTH, NGRAM_COMPONENT, TARGET_ACCURACY, TARGET_WPM } from 'config';
import { addResultToScores, wordsToString } from 'helpers';
import { Result, Scores, Word } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

import styles from './Level.module.scss';

interface LevelProps {
  words: Words;
  scores: Scores;
  onScoresUpdated: (scores: Scores) => void;
}

interface LevelState {
  currentSprint: string;
  currentWords: Word[];
  currentLevel: number;
  ngrams: string[];
  lessonWPM: number;
  wpm: number;
  lastKey: string;
}

export default class Level extends React.Component<LevelProps, LevelState> {
  constructor(props: LevelProps) {
    super(props);

    const currentLevel =
      JSON.parse(localStorage.getItem("level") || "{}").currentLevel || 0;

    const ngrams = getNGramsForLevel(this.props.words, currentLevel);
    const currentWords = this.props.words.getWordsForNGrams(
      ngrams,
      20,
      NGRAM_COMPONENT
    );

    this.state = {
      lastKey: "",
      wpm: 0,
      lessonWPM: 0,
      currentWords,
      currentSprint: wordsToString(currentWords),
      currentLevel,
      ngrams
    };
  }

  public render(): JSX.Element {
    return (
      <div>
        <div className={styles.level}>{this.state.currentLevel + 1}</div>
        <div className={styles.wpm}>
          {this.state.wpm > 0 ? (
            <Digits count={this.state.wpm} />
          ) : (
            `Level ${this.state.currentLevel + 1}`
          )}
        </div>
        <div className={styles.typebox}>
          <TypeBox
            sprint={this.state.currentSprint}
            words={this.state.currentWords}
            onComplete={this.handleSprintComplete}
            onKeyPressed={this.handleKeyPressed}
          />
        </div>

        {false
          ? this.state.ngrams.map((ngram: string) => {
              const result = this.props.scores[ngram];

              const stats = result ? (
                <div className={styles.stats}>
                  {getPercentComplete(TARGET_WPM, TARGET_ACCURACY, result)}
                </div>
              ) : null;

              return (
                <div key={ngram} className={styles.level_item}>
                  <div className={styles.ngram}>{ngram}</div>
                  {stats}
                </div>
              );
            })
          : null}
      </div>
    );
  }

  private handleKeyPressed = (key: string): boolean => {
    this.setState({ lastKey: key });

    if (key === "+") {
      this.handleLevelUp();
      return true;
    }

    if (key === "_") {
      this.handleLevelDown();
      return true;
    }

    if (key === "?") {
      this.handleSprintComplete([], 0);
      return true;
    }
    return false;
  };

  private handleSprintComplete = (results: Result[], wpm: number): void => {
    this.setState({ wpm });

    const scores = { ...this.props.scores };
    results.forEach((result: Result) => {
      // ignore excessive times
      if (result.time < IDLE_THRESHOLD) {
        addResultToScores(scores, result);
      }
    });

    let time = 0;
    let chars = 0;
    for (const ngram of this.state.ngrams) {
      if (!!scores[ngram]) {
        time += scores[ngram].speed;
        chars += ngram.length;
      }
    }

    const lessonWPM = Math.floor(((chars / time) * 1000 * 60) / 5);

    let ngrams: string[] = [...this.state.ngrams];

    this.state.ngrams.forEach((ngram: string) => {
      const result = scores[ngram];
      if (result) {
        const pct = getPercentComplete(TARGET_WPM, TARGET_ACCURACY, result);
        if (pct >= 100) {
          ngrams = ngrams.filter((ng: string) => {
            return ng !== ngram;
          });
        }
      }
    });

    let currentLevel = this.state.currentLevel;
    if (ngrams.length === 0) {
      this.setState({ lessonWPM, ngrams });
      this.handleLevelUp();
      return;
    }

    this.props.onScoresUpdated(scores);
    this.setState({ lessonWPM, ngrams, currentLevel }, () => {
      this.updateNextSprint();
    });
  };

  private handleLevelUp(): void {
    const currentLevel = this.state.currentLevel + 1;
    localStorage.setItem("level", JSON.stringify({ currentLevel }));
    this.setState({ currentLevel, ngrams: [] }, () => {
      this.updateNextSprint();
    });
  }

  private handleLevelDown(): void {
    const currentLevel = Math.max(0, this.state.currentLevel - 1);
    localStorage.setItem("level", JSON.stringify({ currentLevel }));
    this.setState({ currentLevel, ngrams: [] }, () => {
      this.updateNextSprint();
    });
  }

  private updateNextSprint(): void {
    const decilesCompleted = this.state.currentLevel / 10;

    const sprintLength = 20 + decilesCompleted;
    // we let our sprints get longer as we go along
    const length = Math.min(sprintLength, MAX_SPRINT_LENGTH);

    // the ngrams can also be a smaller percentage of the word
    const ngramComp = Math.max(0.2, NGRAM_COMPONENT - decilesCompleted * 0.05);

    const ngrams =
      this.state.ngrams.length === 0
        ? getNGramsForLevel(this.props.words, this.state.currentLevel)
        : this.state.ngrams;
    const currentWords = this.props.words.getWordsForNGrams(
      ngrams,
      length,
      ngramComp
    );

    const currentSprint = wordsToString(currentWords);
    this.setState({
      ngrams,
      currentWords,
      currentSprint
    });
  }
}
