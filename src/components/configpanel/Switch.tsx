import * as React from 'react';

import styles from './Switch.module.scss';

interface SwitchProps {
  name: string;
  valueName: string;
  flipped: boolean;
  onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default class Switch extends React.Component<SwitchProps> {
  public render(): JSX.Element {
    return (
      <div className={styles.container}>
        <label className={styles.switch} htmlFor={this.props.name}>
          <input
            type="checkbox"
            id={this.props.name}
            checked={this.props.flipped}
            onChange={this.props.onToggle}
          />
          <div className={styles.slider + " " + styles.round} />
        </label>
        <label htmlFor={this.props.name}>
          <div className={styles.value_name}>{this.props.valueName}</div>
        </label>
      </div>
    );
  }
}
