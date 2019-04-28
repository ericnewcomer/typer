import * as React from 'react';

interface DigitsProps {
  count: number;
}

interface DigitsState {
  currentCount: number;
}

export default class Digits extends React.Component<DigitsProps, DigitsState> {
  constructor(props: DigitsProps) {
    super(props);
    this.state = {
      currentCount: 0
    };
    this.animateCount();
  }

  public componentDidUpdate(prevProps: DigitsProps): void {
    if (prevProps.count !== this.props.count) {
      this.animateCount();
    }
  }

  public render(): JSX.Element {
    return <span>{this.state.currentCount}</span>;
  }

  private animateCount(): void {
    window.setTimeout(() => {
      this.setState(
        (prevState: DigitsState) => {
          const { currentCount } = prevState;

          return {
            currentCount:
              currentCount > this.props.count
                ? currentCount - 1
                : currentCount + 1
          };
        },
        () => {
          if (this.state.currentCount !== this.props.count) {
            this.animateCount();
          }
        }
      );
    }, 250 - Math.abs(this.state.currentCount - this.props.count) * 30);
  }
}
