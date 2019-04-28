import { react as bindCallbacks } from 'auto-bind';
import Level from 'components/level/Level';
import Sandbox from 'components/sandbox/Sandbox';
import { Scores } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

import styles from './App.module.scss';

interface AppState {
  loaded: boolean;
  lessons: boolean;
  scores: Scores;
}

class App extends React.Component<{}, AppState> {
  private words: Words;
  constructor(props: any) {
    super(props);

    const scores = JSON.parse(localStorage.getItem("app") || "{}").scores || {};
    this.state = {
      lessons: false,
      loaded: false,
      scores
    };

    this.words = new Words(() => {
      this.setState({ loaded: true });
    });

    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  private handleUpdateScores(scores: Scores): void {
    this.setState({ scores }, () => {
      // save our scores in the local storage
      localStorage.setItem(
        "app",
        JSON.stringify({ scores: this.state.scores })
      );
    });
  }

  public render() {
    if (!this.state.loaded) {
      return <div />;
    }

    return (
      <div className={styles.app}>
        {this.state.lessons ? (
          <Level
            words={this.words}
            scores={this.state.scores}
            onScoresUpdated={this.handleUpdateScores}
          />
        ) : (
          <Sandbox
            words={this.words}
            scores={this.state.scores}
            onScoresUpdated={this.handleUpdateScores}
          />
        )}
        <div
          className={styles.toggle}
          onClick={() => this.setState({ lessons: !this.state.lessons })}
        >
          {!this.state.lessons ? "📚" : "🤪"}
        </div>
      </div>
    );
  }
}

export default App;
