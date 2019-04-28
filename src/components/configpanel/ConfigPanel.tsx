import Switch from 'components/configpanel/Switch';
import { Config } from 'config';
import * as React from 'react';

import styles from './ConfigPanel.module.scss';

interface ConfigPanelProps {
  config: Config;
  onConfigUpdated: (config: Config) => void;
}

interface ConfigPanelState {
  open: boolean;
}

interface NumericSetting {
  name: string;
  value: number;
}

export default class ConfigPanel extends React.Component<
  ConfigPanelProps,
  ConfigPanelState
> {
  constructor(props: ConfigPanelProps) {
    super(props);
    this.state = {
      open: false
    };
  }

  public render(): JSX.Element {
    return (
      <>
        <div
          className={styles.panel + " " + (this.state.open ? styles.open : "")}
        >
          <div className={styles.title}>Settings</div>
          <div
            className={styles.close}
            onClick={() => {
              this.setState({ open: false });
            }}
          >
            X
          </div>
          {this.composeNumericSwitch(
            "Speed",
            "targetWPM",
            { name: "100 WPM", value: 100 },
            { name: "85 WPM", value: 85 }
          )}

          {this.composeNumericSwitch(
            "Accuracy",
            "targetAccuracy",
            { name: "100% Accuracy", value: 100 },
            { name: "95% Accuracy", value: 95 }
          )}

          {this.composeNumericSwitch(
            "Frequencey Bias",
            "highFrequencyBias",
            { name: "75% of words can be infrequent", value: 0.25 },
            { name: "25% of words can be infrequent", value: 0.75 }
          )}

          {this.composeNumericSwitch(
            "Random Letters",
            "ngramComponent",
            { name: "75% of letters can be anything", value: 0.25 },
            { name: "50% of letters can be anything", value: 0.5 }
          )}

          {this.composeNumericSwitch(
            "Sprint Length",
            "sprintLength",
            { name: "Longer lessons", value: 45 },
            { name: "Shorter lessons", value: 25 }
          )}
        </div>
        <div
          className={styles.open_panel}
          onClick={() => {
            this.setState({ open: true });
          }}
        >
          <span role="img" aria-label="settings">
            🤔
          </span>
        </div>
      </>
    );
  }

  private composeNumericSwitch(
    name: string,
    property: string,
    on: NumericSetting,
    off: NumericSetting
  ): JSX.Element {
    const active = (this.props.config as any)[property] === on.value ? on : off;

    return (
      <Switch
        name={name}
        valueName={active.name}
        flipped={active === on}
        onToggle={(event: React.ChangeEvent<HTMLInputElement>) => {
          const config: any = { ...this.props.config };
          config[property] = event.target.checked ? on.value : off.value;
          this.props.onConfigUpdated(config);
        }}
      />
    );
  }
}
