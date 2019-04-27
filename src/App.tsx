import './App.scss';

import Level from 'components/level/Level';
import Sandbox from 'components/sandbox/Sandbox';
import * as React from 'react';
import Words from 'Words';

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
      <div className="App">
        {this.state.lessons ? (
          <Level words={this.words} />
        ) : (
          <Sandbox words={this.words} />
        )}
      </div>
    );
  }
}

export default App;
