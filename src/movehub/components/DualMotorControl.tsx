import React, { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo } from '../moveHub';
import { MoveHub } from '../moveHub';

interface IDualMotorControlProps {
  device: MoveHub;
  label1: string;
  label2: string;
  validation1: string;
  validation2: string;
}

export interface IMoveHubPanelWithThemeProps {
  device: MoveHub;
}

export default function DualMotorControl({
  device,
  label1,
  label2,
  validation1,
  validation2
}: IDualMotorControlProps) {
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);
  const [angle1, setAngle1] = useState<string>('90');
  const [angle2, setAngle2] = useState<string>('90');
  const [running, setRunning] = useState(false);
  const [power, setPower] = useState<string>('100');

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: 'motor-AB-polling',
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
  }, [device.deviceInfo]);

  const connected = deviceState.connected === true;

  const handleRunSamePowers = async () => {
    const value = parseInt(angle1, 10);
    const powerValue = parseInt(power, 10);
    if (Number.isNaN(value)) {
      console.error(`Invalid angle for motors A and B: ${angle1}`);
      return;
    }

    if (Number.isNaN(power)) {
      console.error(`Invalid power: ${power}`);
      return;
    }
    setRunning(true);
    try {
      if (value > 0) {
        await device.hub.motorAngleMulti(value, powerValue, powerValue);
      } else {
        await device.hub.motorAngleMulti(-value, -powerValue, -powerValue);
      }
    } catch (e) {
      console.error('Motors A and B command failed:', e);
    } finally {
      setRunning(false);
    }
  };

  const handleRunOppositePowers = async () => {
    const value = parseInt(angle2, 10);
    const powerValue = parseInt(power, 10);
    if (Number.isNaN(value)) {
      console.error(`Invalid angle for motors A and B: ${angle2}`);
      return;
    }

    if (Number.isNaN(power)) {
      console.error(`Invalid power: ${power}`);
      return;
    }
    setRunning(true);
    try {
      if (value > 0) {
        await device.hub.motorAngleMulti(value, powerValue, -powerValue);
      } else {
        await device.hub.motorAngleMulti(-value, -powerValue, powerValue);
      }
    } catch (e) {
      console.error('Motors A and B command failed:', e);
    } finally {
      setRunning(false);
    }
  };

  const labelId = 'motor-control-label-AB';
  const angleId = 'motor-control-angle-AB';
  const powerId = 'motor-control-power-AB';

  const runOnEnterSame = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRunSamePowers();
    }
  };
  const runOnEnterOpposite = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRunOppositePowers();
    }
  };

  return (
    <section className="dashboard-card">
      <h2 className="motor-control-title">Integrated Motors A and B</h2>

      <div className="motor-control-field">
        <label htmlFor={labelId} className="dashboard-card-text">
          {label1}
        </label>
        <div className="motor-control-grid">
          <div className="motor-control-field">
            <label htmlFor={angleId} className="motor-control-field-label">
              Angle
            </label>
            <div className="motor-control-input">
              <input
                id={angleId}
                type="number"
                value={angle1}
                onChange={e => setAngle1(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleRunSamePowers();
                  }
                }}
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
                onKeyDown={runOnEnterSame}
              />
              <span>%</span>
            </div>
          </div>

          <div className="motor-control-field">
            <label
              htmlFor={angleId}
              className="motor-control-field-label"
            ></label>
            <button
              type="button"
              className="motor-control-validation-button"
              onClick={handleRunSamePowers}
              disabled={!connected || running}
            >
              {validation1}
            </button>
          </div>
        </div>

        <div className="motor-control-field">
          <label htmlFor={labelId} className="dashboard-card-text">
            {label2}
          </label>
          <div className="motor-control-grid">
            <div className="motor-control-field">
              <label htmlFor={angleId} className="motor-control-field-label">
                Angle
              </label>
              <div className="motor-control-input">
                <input
                  id={angleId}
                  type="number"
                  value={angle2}
                  onChange={e => setAngle2(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleRunOppositePowers();
                    }
                  }}
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
                  onKeyDown={runOnEnterOpposite}
                />
                <span>%</span>
              </div>
            </div>

            <div className="motor-control-field">
              <label
                htmlFor={angleId}
                className="motor-control-field-label"
              ></label>
              <button
                type="button"
                className="motor-control-validation-button"
                onClick={handleRunOppositePowers}
                disabled={!connected || running}
              >
                {validation2}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
