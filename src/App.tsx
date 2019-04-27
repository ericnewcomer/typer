import Level from 'components/level/Level';
import Sandbox from 'components/sandbox/Sandbox';
import * as React from 'react';
import Words from 'Words';

import styles from './App.module.scss';

console.log(styles);

interface AppState {
  loaded: boolean;
  lessons: boolean;
}

class App extends React.Component<{}, AppState> {
  private words: Words;
  constructor(props: any) {
    super(props);

    this.state = {
      lessons: false,
      loaded: false
    };

    this.words = new Words(() => {
      this.setState({ loaded: true });
    });
  }

  public render() {
    if (!this.state.loaded) {
      return <div />;
    }

    return (
      <div className={styles.app}>
        {this.state.lessons ? (
          <Level words={this.words} />
        ) : (
          <Sandbox words={this.words} />
        )}
        <div
          className={styles.toggle}
          onClick={() => this.setState({ lessons: !this.state.lessons })}
        >
          {this.state.lessons ? "📚" : "🤪"}
        </div>
      </div>
    );
  }
}

export default App;
