import * as React from 'react';
import { TypeBox } from 'src/components/typebox/TypeBox';
import { Result } from 'src/interfaces';
import Words from 'src/Words';

interface LevelProps {
  words: Words;
}

// interface LevelState {}

export default class Level extends React.Component<LevelProps> {
  public render(): JSX.Element {
    return (
      <TypeBox
        sprint="Time to start a lesson!"
        // tslint:disable-next-line: jsx-no-lambda
        onComplete={(results: Result[], wpm: number) => {
          // tslint:disable-next-line: no-console
          console.log(results, wpm);
        }}
      />
    );
  }
}
