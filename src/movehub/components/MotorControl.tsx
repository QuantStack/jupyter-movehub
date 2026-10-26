import React, { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo } from '../moveHub';
import { IMoveHubPanelProps } from './MoveHubPanel';
import { HubAsync } from '../movehub-control/hub/hubAsync';

export interface IMoveFormProps {
  hub: HubAsync;
  label: string;
  actionButton1: string;
  actionButton2: string;
  buttonText1: string;
  buttonText2: string;
  type: string;
  unit?: string;
  port: string;
  caution?: string;
  dutyCycleDirect: number;
  dutyCycleIndirect: number /*dutyCycle: motor power percentage from `-100` to `100`. If a negative value is given rotation is counterclockwise or direct*/;
}

export type MotorPort = 'A' | 'B' | 'C' | 'D';

export interface IMotorControlProps extends IMoveHubPanelProps {
  port?: MotorPort;
  title?: string;
  subtitle?: string;
  /** Display the current angle without the controls to operate the motor. */
  readOnly?: boolean;
}

export default function MotorControl({
  device,
  port = 'A',
  title = `Port ${port}`,
  subtitle = port === 'A' || port === 'B'
    ? 'Integrated Motor'
    : 'External Motor',
  readOnly = false
}: IMotorControlProps) {
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);
  const [angle, setAngle] = useState<string>('45');
  const [power, setPower] = useState<string>('100');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: `motor-${port}-polling`,
      factory: async () => {
        setDeviceState({ ...device.deviceInfo });
      },
      frequency: {
        interval: 200,
        backoff: true
      },
      standby: 'when-hidden'
    });

    poll.start();

    return () => {
      poll.stop();
    };
  }, [device.deviceInfo, port]);

  const connected = deviceState.connected === true;
  const currentAngle = deviceState.ports[port].value;

  const handleRun = async () => {
    const angleValue = parseInt(angle, 10);
    const powerValue = parseInt(power, 10);
    if (Number.isNaN(angleValue)) {
      console.error(`Invalid angle for port ${port}: ${angle}`);
      return;
    }

    if (Number.isNaN(power)) {
      console.error(`Invalid power for port ${port}: ${power}`);
      return;
    }
    setRunning(true);
    try {
      if (angleValue > 0)
        await device.hub.motorAngle(port, angleValue, powerValue);
      else {
        await device.hub.motorAngle(port, -angleValue, -powerValue);
      }
    } catch (e) {
      console.error(`Motor ${port} command failed:`, e);
    } finally {
      setRunning(false);
    }
  };

  const angleId = `motor-control-angle-${port}`;
  const powerId = `motor-control-power-${port}`;
  const runOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRun();
    }
  };

  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title">Port {port}</h2>
      <section className="motor-control">
        <div className="motor-control-header">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              width: '100%'
            }}
          >
            <span className="dashboard-card-muted">Current angle</span>

            <div className="dashboard-card-text">
              {currentAngle !== undefined ? `${currentAngle}°` : '—'}
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="motor-control-grid">
            <div className="motor-control-field">
              <label htmlFor={angleId} className="motor-control-field-label">
                Angle
              </label>
              <div className="motor-control-input">
                <input
                  id={angleId}
                  type="number"
                  value={angle}
                  onChange={e => setAngle(e.target.value)}
                  onKeyDown={runOnEnter}
                />
                <span>°</span>
              </div>
            </div>

            <div className="motor-control-field">
              <label htmlFor={powerId} className="motor-control-field-label">
                Power
              </label>
              <div className="motor-control-input">
                <input
                  id={powerId}
                  type="number"
                  min={0}
                  max={100}
                  value={power}
                  onChange={e => setPower(e.target.value)}
                  onKeyDown={runOnEnter}
                />
                <span>%</span>
              </div>
            </div>

            <button
              type="button"
              className="motor-control-validation-button"
              onClick={handleRun}
              disabled={!connected || running}
            >
              Run
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
