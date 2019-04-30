import Digits from 'components/digits/Digits';
import { addNGramScores, getNGramsForLevel, getPercentComplete, getSeverityColor } from 'components/level/helpers';
import { TypeBox } from 'components/typebox/TypeBox';
import { Config, MAX_SPRINT_LENGTH } from 'config';
import { addResultToScores, getWPM, wordsLength, wordsToString } from 'helpers';
import { Result, Scores, Undefinable, Word } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

import styles from './Level.module.scss';

interface LevelProps {
  config: Config;
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
      Math.min(this.props.config.sprintLength, MAX_SPRINT_LENGTH),
      this.props.config.ngramComponent
    );

    addNGramScores(
      this.props.config.targetWPM,
      this.props.config.targetAccuracy,
      currentWords,
      this.props.scores
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

        <div className={styles.progress}>
          {this.state.ngrams.map((ngram: string) => {
            const result = this.props.scores[ngram];

            const pct = result
              ? getPercentComplete(
                  this.props.config.targetWPM,
                  this.props.config.targetAccuracy,
                  result
                )
              : 0;

            return (
              <div
                key={ngram}
                className={
                  styles.level_item + " " + (pct === 100 ? styles.complete : "")
                }
                style={
                  {
                    // borderColor: getSeverityColor(
                    // result ? result.accuracy + 0.05 : 1
                    //)
                  }
                }
              >
                <div
                  className={styles.progress_bar}
                  style={{
                    background: getSeverityColor(result ? pct : 0),
                    height: pct + "%"
                  }}
                />
                <div className={styles.ngram}>{ngram}</div>
                {result ? (
                  <div className={styles.wpm_wrapper}>
                    <div
                      className={styles.ngram_wpm}
                      style={{
                        color: "rgba(0,0,0,.4)",
                        background: pct >= 100 ? "#fff" : "#fff" // getSeverityColor(result ? result.accuracy : 0)
                      }}
                    >
                      {pct >= 100 ? "🔥" : <Digits count={getWPM(result)} />}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
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

    // check incomplete before update so we have one round after completion before moving on
    let incomplete = 0;
    this.state.ngrams.forEach((ngram: string) => {
      const result = scores[ngram];
      if (result) {
        const pct = getPercentComplete(
          this.props.config.targetWPM,
          this.props.config.targetAccuracy,
          result
        );
        if (pct < 100) {
          incomplete++;
        }
      }
    });

    let mistake: Undefinable<Word>;
    results.forEach((result: Result) => {
      if (!result.correct) {
        mistake = result.word;
      }

      // ignore excessive times
      if (result.time < this.props.config.idleThreshold) {
        addResultToScores(scores, result, this.props.config.rollingAverage);
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

    let currentLevel = this.state.currentLevel;
    if (incomplete === 0) {
      // this.setState({ lessonWPM });
      this.handleLevelUp();
      return;
    }

    this.props.onScoresUpdated(scores);
    this.setState({ lessonWPM, ngrams, currentLevel }, () => {
      // see if they need to be punished
      if (this.props.config.punishment && mistake) {
        const words: Word[] = [];
        while (
          wordsLength([...words, mistake]) < this.props.config.sprintLength
        ) {
          words.push(mistake);
        }

        this.setState({
          currentWords: words,
          currentSprint: wordsToString(words)
        });
      } else {
        this.updateNextSprint();
      }
    });
  };

  private handleLevelUp(): void {
    const currentLevel = this.state.currentLevel + 1;
    localStorage.setItem("level", JSON.stringify({ currentLevel }));
    this.setState({ currentLevel, ngrams: [], lessonWPM: 0 }, () => {
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

    let sprintLength = Math.max(
      20 + decilesCompleted,
      this.props.config.sprintLength
    );
    // we let our sprints get longer as we go along
    sprintLength = Math.min(sprintLength, MAX_SPRINT_LENGTH);

    // the ngrams can also be a smaller percentage of the word
    const ngramComp = Math.max(
      0.2,
      this.props.config.ngramComponent - decilesCompleted * 0.05
    );

    let incompleteGrams = this.state.ngrams.filter((ngram: string) => {
      const result = this.props.scores[ngram];
      return (
        result &&
        getPercentComplete(
          this.props.config.targetWPM,
          this.props.config.targetAccuracy,
          result
        ) < 100
      );
    });

    let ngrams = this.state.ngrams;
    if (incompleteGrams.length === 0) {
      incompleteGrams = getNGramsForLevel(
        this.props.words,
        this.state.currentLevel
      );
      ngrams = incompleteGrams;
    }

    const currentWords = this.props.words.getWordsForNGrams(
      incompleteGrams,
      sprintLength,
      ngramComp
    );

    addNGramScores(
      this.props.config.targetWPM,
      this.props.config.targetAccuracy,
      currentWords,
      this.props.scores
    );

    console.log(currentWords);

    const currentSprint = wordsToString(currentWords);
    this.setState({
      ngrams,
      currentWords,
      currentSprint
    });
  }
}
