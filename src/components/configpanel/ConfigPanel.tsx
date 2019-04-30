import 'nouislider/distribute/nouislider.css';

import Switch from 'components/configpanel/Switch';
import { Config } from 'config';
import Nouislider from 'nouislider-react';
import * as React from 'react';

import styles from './ConfigPanel.module.scss';

interface ConfigPanelProps {
  config: Config;
  section: string;
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

  onUpdateSlider = (property: string, floor: boolean = false) => (
    render: any,
    handle: any,
    value: number,
    un: any,
    percent: any
  ) => {
    const config: any = { ...this.props.config };
    config[property] = floor ? Math.floor(value) : value;
    this.props.onConfigUpdated(config);
  };

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

          <div className={styles.section}>
            <div className={styles.subtitle}>General</div>

            {this.composeNumericSwitch(
              "Sprint Length",
              "sprintLength",
              { name: "Longer sprints", value: 45 },
              { name: "Shorter sprints", value: 25 }
            )}

            {this.composeNumericSwitch(
              "Random Letters",
              "ngramComponent",
              { name: "75% of letters can be anything", value: 0.25 },
              { name: "50% of letters can be anything", value: 0.5 }
            )}
          </div>

          {this.props.section === "lessons" ? (
            <div className={styles.section}>
              <div className={styles.subtitle}>Lessons</div>

              <div className={styles.punishment}>
                <Nouislider
                  onChange={this.onUpdateSlider("painLevel", true) as any}
                  range={{ min: 0, max: 10 }}
                  step={1}
                  tooltips={[
                    {
                      to: (value: number) => {
                        if (value === 0) {
                          return "<div class='tooltip-emoji'>😄</div>";
                        } else if (value < 2) {
                          return "<div class='tooltip-emoji'>😬</div>";
                        } else if (value < 5) {
                          return "<div class='tooltip-emoji'>😫</div>";
                        } else if (value < 10) {
                          return "<div class='tooltip-emoji'>😡</div>";
                        } else {
                          return "<div class='tooltip-emoji'>🤬</div>";
                        }
                      }
                    }
                  ]}
                  start={[this.props.config.painLevel]}
                />
              </div>

              <div className={styles.wpm}>
                <Nouislider
                  onChange={this.onUpdateSlider("targetWPM", true) as any}
                  range={{ min: 30, max: 135 }}
                  tooltips={[
                    { to: (value: number) => Math.floor(value) + " WPM" }
                  ]}
                  start={[this.props.config.targetWPM]}
                />
              </div>

              <div className={styles.accuracy}>
                <Nouislider
                  onChange={this.onUpdateSlider("targetAccuracy", true) as any}
                  range={{ min: 75, max: 99 }}
                  tooltips={[
                    { to: (value: number) => Math.floor(value) + "% Accuracy" }
                  ]}
                  start={[this.props.config.targetAccuracy]}
                />
              </div>
            </div>
          ) : null}

          {this.props.section === "sandbox" ? (
            <div className={styles.section}>
              <div className={styles.subtitle}>Sandbox</div>

              {this.composeNumericSwitch(
                "Score Lifespan",
                "scoreLifespan",
                { name: "Frequently choose new problems", value: 5 },
                { name: "Work on problems longer", value: 20 }
              )}

              {this.composeNumericSwitch(
                "Frequencey Bias",
                "highFrequencyBias",
                { name: "40% of words can be infrequent", value: 0.6 },
                { name: "5% of words can be infrequent", value: 0.95 }
              )}

              {this.composeNumericSwitch(
                "History Bias",
                "historyBias",
                { name: "Occassionally add words randomly", value: 0.75 },
                { name: "Only pick words with problems", value: 1 }
              )}
            </div>
          ) : null}
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
    off: NumericSetting,
    pain?: boolean
  ): JSX.Element {
    const active = (this.props.config as any)[property] === on.value ? on : off;

    return (
      <Switch
        name={name}
        valueName={active.name}
        flipped={active === on}
        pain={pain}
        onToggle={(event: React.ChangeEvent<HTMLInputElement>) => {
          const config: any = { ...this.props.config };
          config[property] = event.target.checked ? on.value : off.value;
          this.props.onConfigUpdated(config);
        }}
      />
    );
  }
}
