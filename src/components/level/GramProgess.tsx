import { getPercentComplete, getSeverityColor } from 'components/level/helpers';
import { Config } from 'config';
import { NGramRecord } from 'interfaces';
import * as React from 'react';

import styles from './GramProgress.module.scss';

interface GramProgressProps {
  gram: string;
  record: NGramRecord;
  config: Config;
  size: number;
}

export default class GramProgress extends React.Component<GramProgressProps> {
  public render(): JSX.Element {
    const pct = this.props.record
      ? getPercentComplete(
          this.props.config.targetWPM,
          this.props.config.targetAccuracy,
          this.props.record
        )
      : 0;

    return (
      <div
        key={this.props.gram}
        className={
          styles.level_item + " " + (pct === 100 ? styles.complete : "")
        }
        style={{
          width: this.getSize(35),
          height: this.getSize(25),
          marginRight: this.getSize(3),
          marginBottom: this.getSize(3),
          fontSize: this.getSize(12),
          background: getSeverityColor(pct),
          borderColor: getSeverityColor(pct, 0.8)
        }}
      >
        <div
          className={styles.ngram}
          style={{ lineHeight: this.getSize(24) + "px" }}
        >
          {this.props.gram}
        </div>
        {/* {pct >= 100 ? "🔥" : <Digits count={getWPM(this.props.record)} />} */}
      </div>
    );
  }

  private getSize(num: number): number {
    return Math.floor(num * this.props.size);
  }
}
