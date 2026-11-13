import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo } from '../moveHub';
import { MoveHub } from '../moveHub';
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

type Action = 'drive' | 'turn' | 'stop';

interface IControl {
  icon: LabIcon;
  label: string;
  action: Action;
  direction: number;
  className: string;
}

const CONTROLS: IControl[] = [
  {
    icon: arrowUpIcon,
    label: 'Drive forward',
    action: 'drive',
    direction: 1,
    className: 'jp-mod-accept'
  },
  {
    icon: turnLeftIcon,
    label: 'Turn left',
    action: 'turn',
    direction: -1,
    className: 'jp-mod-accept'
  },
  {
    icon: stopIcon,
    label: 'Stop',
    action: 'stop',
    direction: 0,
    className: 'jp-mod-warn'
  },
  {
    icon: turnRightIcon,
    label: 'Turn right',
    action: 'turn',
    direction: 1,
    className: 'jp-mod-accept'
  },
  {
    icon: arrowDownIcon,
    label: 'Drive backward',
    action: 'drive',
    direction: -1,
    className: 'jp-mod-accept'
  }
];

const MOVES = {
  Vernie: {
    drive: { tap: 20, hold: 3600 },
    turn: { tap: 90, hold: 3600 },
    shortPressLabel: 'Short press: drive about 20 cm or turn 90°',
    longPressLabel: 'Long press (over 1 s): keep moving',
    longPressThreshold: 1000
  },
  R2D2: {
    drive: { tap: 0, hold: 3600 },
    turn: { tap: 0, hold: 3600 },
    shortPressLabel: '',
    longPressLabel:
      'Press to drive R2D2 (continuous move), stop with red button',
    longPressThreshold: 10
  }
} as const;

type TelecommandBuild = keyof typeof MOVES;

interface ITelecommandProps {
  device: MoveHub;
  build: TelecommandBuild;
}

export function Telecommand({ device, build }: ITelecommandProps) {
  const pressStart = useRef(0);
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: `telecommand-polling`,
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

  const handleDown = () => {
    pressStart.current = Date.now();
  };

  const handleUp = async ({ action, direction }: IControl) => {
    if (action === 'stop') {
      device.stop();
      return;
    }
    const longPress =
      Date.now() - pressStart.current >=
      MOVES[build as TelecommandBuild].longPressThreshold;
    try {
      const moves = MOVES[build as TelecommandBuild];
      if (!moves) {
        console.warn(`No move config for build "${build}"`);
        return;
      }

      if (action === 'drive') {
        await (longPress
          ? device.hub.driveToDirection(direction)
          : device.hub.drive(moves.drive.tap * direction));
        return;
      }

      await device.hub.turn(
        (longPress ? moves.turn.hold : moves.turn.tap) * direction
      );
    } catch (e) {
      console.error(`${action} failed:`, e);
    }
  };

  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title">Remote control</h2>
      {build !== 'R2D2' && (
        <div className="dashboard-card-muted">
          {MOVES[build as TelecommandBuild].shortPressLabel}
        </div>
      )}
      <div className="dashboard-card-muted">
        {MOVES[build as TelecommandBuild].longPressLabel}
      </div>

      <div className="telecommand-grid">
        {CONTROLS.map(control => (
          <button
            key={control.label}
            type="button"
            className={['telecommand-button jp-mod-styled', control.className]
              .filter(Boolean)
              .join(' ')}
            aria-label={control.label}
            title={control.label}
            onMouseDown={handleDown}
            onMouseUp={() => handleUp(control)}
            disabled={!connected}
          >
            <control.icon.react tag="span" className="telecommand-icon" />
          </button>
        ))}
      </div>
    </section>
  );
}
