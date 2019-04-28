import './TypeBox.scss';

import { isInsideGram } from 'helpers';
import { Result, Word } from 'interfaces';
import * as React from 'react';

enum CharState {
  untyped = "untyped",
  correct = "correct",
  incorrect = "incorrect"
}

interface TypeBoxProps {
  sprint: string;

  onComplete: (results: Result[], wpm: number) => void;

  // used for optional ngram highlighting
  words?: Word[];

  // let our parent handle key presses
  onKeyPressed?: (key: string) => boolean;
}

interface TypeBoxState {
  entry: string;
  sprintState: CharState[];
  cursor: number;
  lastKeyPress: number;
  timings: number[];
}

export class TypeBox extends React.Component<TypeBoxProps, TypeBoxState> {
  private ele!: HTMLDivElement;

  constructor(props: TypeBoxProps) {
    super(props);
    this.state = {
      cursor: 0,
      entry: "",
      lastKeyPress: 0,
      sprintState: this.getEmptySprintState(),
      timings: []
    };
  }

  public componentDidMount() {
    this.ele.focus();
  }

  public render(): JSX.Element {
    // tslint:disable-next-line: no-console
    // console.log(this.state.entry, this.state.sprintState);
    const chars = [];
    for (let i = 0; i < this.props.sprint.length; i++) {
      const nextChar = this.props.sprint.charAt(i);
      const charState = this.state.sprintState[i];

      const classes = ["character"];
      if (nextChar === " ") {
        classes.push("space");
      }

      if (i === this.state.cursor) {
        classes.push("cursor");
      }

      if (
        charState === CharState.untyped &&
        isInsideGram(this.props.words || [], i)
      ) {
        classes.push("ngram");
      }

      classes.push(charState);

      chars.push(
        <div key={"char_" + i} className={classes.join(" ")}>
          {nextChar === " " ? " " : nextChar}{" "}
        </div>
      );
    }

    return (
      <div
        tabIndex={0}
        onKeyPress={this.onKeyDown}
        className="typebox"
        ref={(ele: HTMLDivElement) => {
          this.ele = ele;
        }}
      >
        {chars}
      </div>
    );
  }

  public componentDidUpdate(prevProps: TypeBoxProps): void {
    if (prevProps.sprint !== this.props.sprint) {
      this.setState({ sprintState: this.getEmptySprintState() });
    }
  }

  private getEmptySprintState(): CharState[] {
    const sprintState: CharState[] = [];
    for (let i = 0; i < this.props.sprint.length; i++) {
      sprintState.push(CharState.untyped);
    }
    return sprintState;
  }

  private reset(): void {
    this.setState({
      timings: [],
      cursor: 0,
      entry: "",
      lastKeyPress: 0,
      sprintState: this.getEmptySprintState()
    });
  }

  private onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) =>
    this.handleKeyDown(event.key, event.which + event.keyCode);

  private computeGrams(gramSize: number): Result[] {
    const results: Result[] = [];
    for (let i = 0; i < this.props.sprint.length; i++) {
      let gram = this.props.sprint.substr(i, gramSize);

      if (gramSize > 1) {
        gram = gram.toLowerCase();
      }

      // tslint:disable-next-line: no-console
      // console.log(this.state.sprintState);

      if (
        gram.indexOf(" ") < 0 &&
        gram.length === gramSize &&
        (gramSize === 1 || gram.match(/^([a-zA-Z0-9 _-]+)$/))
      ) {
        let correct = true;
        let time = 0;
        for (let j = 0; j < gramSize; j++) {
          correct =
            correct && this.state.sprintState[i + j] === CharState.correct;
          time += this.state.timings[i + j];
        }

        if (time > 0) {
          results.push({
            type: gramSize,
            gram,
            correct,
            time
          });
        }
      }
    }
    return results;
  }

  private getWPM(): number {
    const times = this.state.timings.filter((time: number) => time > 0);
    const totalMillis = times.reduce((a: number, b: number) => a + b);
    const minutes = totalMillis / 1000 / 60;
    const cpm = times.length / minutes;
    return Math.floor(cpm / 5);
  }

  private computeResults(): Result[] {
    const results: Result[] = [
      ...this.computeGrams(1),
      ...this.computeGrams(2),
      ...this.computeGrams(3),
      ...this.computeGrams(4)
    ];

    return results;
  }

  private handleKeyDown(key: string, keyCode: number) {
    if (this.props.onKeyPressed) {
      if (this.props.onKeyPressed(key)) {
        return;
      }
    }

    if (key.length > 1) {
      return;
    }

    const entry = this.state.entry + key;
    const timings = this.state.timings;
    let entryIndex = 0;
    let currentIndex = 0;
    let cursor = 0;
    const sprintState: CharState[] = [...this.state.sprintState];

    let lastKeyPress = this.state.lastKeyPress;

    for (let i = 0; i < this.props.sprint.length; i++) {
      const nextChar = this.props.sprint.charAt(i);
      let correct = true;

      while (entryIndex < entry.length) {
        if (entry.charAt(entryIndex) !== nextChar) {
          correct = false;
          entryIndex++;
        } else {
          entryIndex++;
          currentIndex++;
          break;
        }
      }

      if (i === currentIndex) {
        cursor = i;
        if (this.state.lastKeyPress !== 0) {
          if (correct) {
            const now = new Date().getTime();
            const took = now - this.state.lastKeyPress;
            timings.push(took);
            lastKeyPress = now;
          }
        } else {
          lastKeyPress = new Date().getTime();
          timings.push(-1);
        }
      }

      if (i < currentIndex || !correct) {
        sprintState[i] = correct ? CharState.correct : CharState.incorrect;
      }
    }

    if (currentIndex >= this.props.sprint.length) {
      const now = new Date().getTime();
      const took = now - this.state.lastKeyPress;
      timings.push(took);

      const sprintState = { ...this.state.sprintState };

      if (
        sprintState[this.state.sprintState.length - 1] === CharState.untyped
      ) {
        sprintState[this.state.sprintState.length - 1] = CharState.correct;
      }

      this.props.onComplete(this.computeResults(), this.getWPM());
      this.reset();
    } else {
      this.setState({
        cursor,
        entry,
        lastKeyPress,
        sprintState,
        timings
      });
    }
  }
}
