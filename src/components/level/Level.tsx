import './Level.scss';

import { getNGramsForLevel, getPercentComplete } from 'components/level/helpers';
import { TypeBox } from 'components/typebox/TypeBox';
import { IDLE_THRESHOLD, MAX_SPRINT_LENGTH, NGRAM_COMPONENT, TARGET_ACCURACY, TARGET_WPM } from 'config';
import { addResultToScores, wordsToString } from 'helpers';
import { Result, Scores, Word } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

interface LevelProps {
  words: Words;
}

interface LevelState {
  currentSprint: string;
  currentWords: Word[];
  currentLevel: number;
  ngrams: string[];
  lessonWPM: number;
  wpm: number;
  scores: Scores;
  lastKey: string;
}

export default class Level extends React.Component<LevelProps, LevelState> {
  constructor(props: LevelProps) {
    super(props);

    const currentLevel = 0;
    const ngrams = getNGramsForLevel(this.props.words, currentLevel);
    const currentWords = this.props.words.getWordsForNGrams(
      ngrams,
      20,
      NGRAM_COMPONENT
    );

    this.state = {
      lastKey: "",
      scores: {},
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
        <div className="level">{this.state.currentLevel + 1}</div>
        <TypeBox
          sprint={this.state.currentSprint}
          words={this.state.currentWords}
          onComplete={this.handleSprintComplete}
          onKeyPressed={this.handleKeyPressed}
        />

        {this.state.ngrams.map((ngram: string) => {
          const result = this.state.scores[ngram];

          const stats = result ? (
            <div className="stats">
              {getPercentComplete(TARGET_WPM, TARGET_ACCURACY, result)}
            </div>
          ) : null;

          return (
            <div key={ngram} className="level-item">
              <div className="ngram">{ngram}</div>
              {stats}
            </div>
          );
        })}
      </div>
    );
  }

  private handleKeyPressed = (key: string): boolean => {
    this.setState({ lastKey: key });
    // tslint:disable-next-line: no-console
    if (key === "+") {
      this.setState({ currentLevel: this.state.currentLevel + 1 }, () => {
        this.updateNextSprint();
      });
      return true;
    }

    if (key === "_") {
      // tslint:disable-next-line: no-console
      this.setState(
        { currentLevel: Math.max(this.state.currentLevel - 1, 0) },
        () => {
          this.updateNextSprint();
        }
      );
      return true;
    }
    return false;
  };

  private handleSprintComplete = (results: Result[], wpm: number): void => {
    this.setState({ wpm });

    const scores = { ...this.state.scores };
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
    this.setState({ scores, lessonWPM });
    this.updateNextSprint();
  };

  private updateNextSprint(): void {
    const decilesCompleted = this.state.currentLevel / 10;

    const sprintLength = 20 + decilesCompleted;
    // we let our sprints get longer as we go along
    const length = Math.min(sprintLength, MAX_SPRINT_LENGTH);

    // the ngrams can also be a smaller percentage of the word
    const ngramComp = Math.max(0.2, NGRAM_COMPONENT - decilesCompleted * 0.05);

    const ngrams = getNGramsForLevel(this.props.words, this.state.currentLevel);
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
