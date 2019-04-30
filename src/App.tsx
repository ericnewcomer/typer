import { react as bindCallbacks } from 'auto-bind';
import ConfigPanel from 'components/configpanel/ConfigPanel';
import { getSeverityColor } from 'components/level/helpers';
import Level from 'components/level/Level';
import Sandbox from 'components/sandbox/Sandbox';
import { Config, getDefaultConfig } from 'config';
import { Scores } from 'interfaces';
import * as React from 'react';
import Words from 'Words';

import styles from './App.module.scss';

interface AppState {
  loaded: boolean;
  lessons: boolean;
  scores: Scores;
  config: Config;
}

class App extends React.Component<{}, AppState> {
  private words: Words;
  constructor(props: any) {
    super(props);

    const appState: Partial<AppState> = JSON.parse(
      localStorage.getItem("app") || "{}"
    );

    const config = appState.config || getDefaultConfig();
    config.painLevel = config.painLevel || 0;

    this.state = {
      lessons: !!appState.lessons,
      loaded: false,
      scores: appState.scores || {},
      config
    };

    this.words = new Words(() => {
      this.setState({ loaded: true });
    });

    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  private saveToBrowserStorage() {
    // save our scores in the local storage
    localStorage.setItem(
      "app",
      JSON.stringify({
        scores: this.state.scores,
        config: this.state.config,
        lessons: this.state.lessons
      })
    );
  }

  private handleUpdateScores(scores: Scores): void {
    this.setState({ scores }, () => {
      this.saveToBrowserStorage();
    });
  }

  private handleConfigUpdated(config: Config): void {
    this.setState({ config }, () => {
      this.saveToBrowserStorage();
    });
  }

  private handleLessonToggle(): void {
    this.setState({ lessons: !this.state.lessons }, () => {
      this.saveToBrowserStorage();
    });
  }

  public render() {
    if (!this.state.loaded) {
      return <div />;
    }

    const colors = [];
    for (let i = 0; i < 100; i++) {
      colors.push(
        <div
          style={{
            height: 20,
            width: 20,
            background: getSeverityColor(i)
          }}
        >
          {i}
        </div>
      );
    }

    return (
      <div className={styles.app}>
        <ConfigPanel
          section={this.state.lessons ? "lessons" : "sandbox"}
          config={this.state.config}
          onConfigUpdated={this.handleConfigUpdated}
        />
        {this.state.lessons ? (
          <Level
            config={this.state.config}
            words={this.words}
            scores={this.state.scores}
            onScoresUpdated={this.handleUpdateScores}
          />
        ) : (
          <Sandbox
            config={this.state.config}
            words={this.words}
            scores={this.state.scores}
            onScoresUpdated={this.handleUpdateScores}
          />
        )}
        <div className={styles.toggle} onClick={this.handleLessonToggle}>
          {!this.state.lessons ? "📚" : "🤪"}
        </div>
      </div>
    );
  }
}

export default App;
