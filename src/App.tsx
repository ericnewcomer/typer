import './App.css';

import * as React from 'react';
import Sandbox from 'src/components/sandbox/Sandbox';
import { NGramRecord } from 'src/interfaces';
import Words from 'src/Words';

export interface Scores {
  [gram: string]: NGramRecord;
}

class App extends React.Component {
  private words: Words;
  constructor(props: any) {
    super(props);
    this.words = new Words();
  }

  public render() {
    return (
      <div className="App">
        <Sandbox words={this.words} />
      </div>
    );
  }
}

export default App;
