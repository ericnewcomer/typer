import Digits from 'components/digits/Digits';
import GramProgress from 'components/level/GramProgess';
import {
  addNGramScores as addGramScores,
  getAllNGrams as getAllGrams,
  getIncompleteGrams,
  getPercentComplete
} from 'components/level/helpers';
import { TypeBox } from 'components/typebox/TypeBox';
import { Config, MAX_SPRINT_LENGTH } from 'config';
import { addResultToScores, wordsLength, wordsToString } from 'helpers';
import { Result, Scores, Word } from 'interfaces';
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
  mistakes: Word[];
  currentSprint: string;
  currentWords: Word[];
  currentLevel: number;
  grams: string[];
  completedGrams: string[];
  lessonWPM: number;
  wpm: number;
  lastKey: string;
}

export default class Level extends React.Component<LevelProps, LevelState> {
  constructor(props: LevelProps) {
    super(props);

    const currentLevel =
      JSON.parse(localStorage.getItem("level") || "{}").currentLevel || 0;

    this.state = {
      lastKey: "",
      wpm: 0,
      lessonWPM: 0,
      mistakes: [],
      grams: [],
      completedGrams: getAllGrams(this.props.words, currentLevel),
      currentLevel,
      currentWords: [],
      currentSprint: ""
    };
  }

  public componentDidMount() {
    this.updateNextSprint();
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
        <div className={styles.current_grams}>
          {(this.state.grams || []).map((gram: string) => {
            const record = this.props.scores[gram];
            return (
              <GramProgress
                key={gram + "_current_progress"}
                gram={gram}
                record={record}
                config={this.props.config}
                size={2}
              />
            );
          })}
        </div>

        <div className={styles.progress}>
          {this.state.completedGrams.map((ngram: string) => {
            const record = this.props.scores[ngram];

            return (
              <GramProgress
                key={ngram + "_progress"}
                gram={ngram}
                record={record}
                config={this.props.config}
                size={1}
              />
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

    const mistakes: Word[] = [...this.state.mistakes];
    const lastMistake = mistakes.shift();
    const scores = { ...this.props.scores };

    // check incomplete before update so we have one round after completion before moving on
    let incomplete = 0;

    this.state.grams.forEach((ngram: string) => {
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
      } else {
        incomplete++;
      }
    });

    results.forEach((result: Result) => {
      if (this.props.config.painLevel > 0) {
        if (!result.correct) {
          if (result.word) {
            const text = result.word.text;
            if (!mistakes.find((word: Word) => word.text === text)) {
              if (result.word === lastMistake) {
                mistakes.unshift(lastMistake);
              } else {
                mistakes.push(result.word);
              }
            }
          }
        }
      }

      // ignore excessive times or punishment
      if (
        result.time < this.props.config.idleThreshold &&
        this.state.mistakes.length === 0
      ) {
        addResultToScores(scores, result, this.props.config.rollingAverage);
      }
    });

    let time = 0;
    let chars = 0;
    for (const ngram of this.state.grams) {
      if (!!scores[ngram]) {
        time += scores[ngram].speed;
        chars += ngram.length;
      }
    }

    this.props.onScoresUpdated(scores);
    const lessonWPM = Math.floor(((chars / time) * 1000 * 60) / 5);

    let ngrams: string[] = [...this.state.grams];

    let currentLevel = this.state.currentLevel;
    if (incomplete === 0) {
      // this.setState({ lessonWPM });
      this.handleLevelUp();
      return;
    }

    if (mistakes.length > this.props.config.painLevel) {
      mistakes.splice(0, mistakes.length - this.props.config.painLevel);
    }

    this.setState({ lessonWPM, grams: ngrams, currentLevel, mistakes }, () => {
      // see if they need to be punished
      if (this.props.config.painLevel > 0 && mistakes.length > 0) {
        const mistake = mistakes[0];
        const words: Word[] = [];
        while (
          wordsLength([...words, mistake]) < this.props.config.sprintLength
        ) {
          words.push(mistake);
        }

        this.setState({
          mistakes,
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
    this.setState(
      {
        currentLevel,
        grams: [],
        wpm: 0,
        completedGrams: getAllGrams(this.props.words, currentLevel)
      },
      () => {
        this.updateNextSprint();
      }
    );
  }

  private handleLevelDown(): void {
    const currentLevel = Math.max(0, this.state.currentLevel - 1);
    localStorage.setItem("level", JSON.stringify({ currentLevel }));
    this.setState(
      {
        currentLevel,
        grams: [],
        completedGrams: getAllGrams(this.props.words, currentLevel)
      },
      () => {
        this.updateNextSprint();
      }
    );
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
    const ngramComp = this.props.config
      .ngramComponent; /* Math.max(
      0.2,
      this.props.config.ngramComponent - decilesCompleted * 0.05
    );*/

    let incompleteGrams = this.state.grams.filter((ngram: string) => {
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

    if (incompleteGrams.length === 0) {
      incompleteGrams = getIncompleteGrams(
        this.props.words,
        this.state.currentLevel,
        this.props.scores,
        this.props.config
      );
    }

    const currentWords = this.props.words.getWordsForNGrams(
      incompleteGrams,
      sprintLength,
      ngramComp
    );

    addGramScores(
      this.props.config.targetWPM,
      this.props.config.targetAccuracy,
      currentWords,
      this.props.scores
    );

    const currentSprint = wordsToString(currentWords);
    this.setState({
      grams: incompleteGrams,
      currentWords,
      currentSprint
    });
  }
}
