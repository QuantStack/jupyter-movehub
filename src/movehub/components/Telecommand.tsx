import React from 'react';
import { MoveHub } from '../moveHub';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import { useRef } from 'react';

import { LabIcon } from '@jupyterlab/ui-components';
import stopSvgStr from '../../../style/icons/stop.svg';
import arrowUpSvgStr from '../../../style/icons/arrow-up.svg';
import arrowDownSvgStr from '../../../style/icons/arrow-down.svg';
import turnRightSvgStr from '../../../style/icons/turn-right.svg';
import turnLeftSvgStr from '../../../style/icons/turn-left.svg';
export const stopIcon = new LabIcon({
  name: 'movehub:stop',
  svgstr: stopSvgStr
});
export const arrowUpIcon = new LabIcon({
  name: 'movehub:arrow-up',
  svgstr: arrowUpSvgStr
});
export const arrowDownIcon = new LabIcon({
  name: 'movehub:arrow-down',
  svgstr: arrowDownSvgStr
});
export const turnRightIcon = new LabIcon({
  name: 'movehub:turn-right',
  svgstr: turnRightSvgStr
});
export const turnLeftIcon = new LabIcon({
  name: 'movehub:turn-left',
  svgstr: turnLeftSvgStr
});

const LONG_PRESS_THRESHOLD = 1000;

export interface IMoveHubControlProps {
  device: MoveHub;
}

type Action = 'drive' | 'turn' | 'stop';

interface IControl {
  icon: LabIcon;
  label: string;
  action: Action;
  direction: number;
}

const CONTROLS: IControl[] = [
  { icon: arrowUpIcon, label: 'Drive forward', action: 'drive', direction: 1 },
  { icon: turnLeftIcon, label: 'Turn left', action: 'turn', direction: -1 },
  { icon: stopIcon, label: 'Stop', action: 'stop', direction: 0 },
  { icon: turnRightIcon, label: 'Turn right', action: 'turn', direction: 1 },
  {
    icon: arrowDownIcon,
    label: 'Drive backward',
    action: 'drive',
    direction: -1
  }
];

export function Telecommand({ device }: IMoveHubPanelWithThemeProps) {
  const pressStart = useRef(0);

  const handleDown = () => {
    pressStart.current = Date.now();
  };

  const handleUp = async ({ action, direction }: IControl) => {
    if (action === 'stop') {
      device.stop();
      return;
    }
    const longPress = Date.now() - pressStart.current >= LONG_PRESS_THRESHOLD;
    try {
      if (action === 'drive') {
        await (longPress
          ? device.hub.driveToDirection(direction)
          : device.hub.drive(20 * direction));
      } else {
        await device.hub.turn((longPress ? 3600 : 90) * direction);
      }
    } catch (e) {
      console.error(`${action} failed:`, e);
    }
  };

  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title">Remote control</h2>
      <div className="dashboard-card-muted">
        Short press: drive 20 cm or turn 90°
      </div>
      <div className="dashboard-card-muted">
        Long press (over 1 s): keep moving
      </div>

      <div className="telecommand-grid">
        {CONTROLS.map(control => (
          <button
            key={control.label}
            type="button"
            className="telecommand-button"
            aria-label={control.label}
            title={control.label}
            onMouseDown={handleDown}
            onMouseUp={() => handleUp(control)}
          >
            <control.icon.react tag="span" className="telecommand-icon" />
          </button>
        ))}
      </div>
    </section>
  );
}
