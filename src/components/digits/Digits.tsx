import * as React from 'react';

interface DigitsProps {
  count: number;
}

interface DigitsState {
  currentCount: number;
}

export default class Digits extends React.Component<DigitsProps, DigitsState> {
  private lastTimeout: any;

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

  public componentWillUnmount(): void {
    if (this.lastTimeout) {
      window.clearTimeout(this.lastTimeout);
    }
  }

  public render(): JSX.Element {
    return <span>{this.state.currentCount}</span>;
  }

  private animateCount(): void {
    this.lastTimeout = window.setTimeout(() => {
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
