import React from 'react';
import { MoveHub } from '../moveHub';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import arrowUpSVG from '../../../style/icons/arrow-up.svg';
import arrowDownSVG from '../../../style/icons/arrow-down.svg';
import turnRightSVG from '../../../style/icons/turn-right.svg';
import turnLeftSVG from '../../../style/icons/turn-left.svg';
import stopSVG from '../../../style/icons/stop.svg';
const stopSVGUrl = `data:image/svg+xml;base64,${btoa(stopSVG)}`;
const arrowUpSVGUrl = `data:image/svg+xml;base64,${btoa(arrowUpSVG)}`;
const arrowDownSVGUrl = `data:image/svg+xml;base64,${btoa(arrowDownSVG)}`;
const turnLeftSVGUrl = `data:image/svg+xml;base64,${btoa(turnLeftSVG)}`;
const turnRightSVGUrl = `data:image/svg+xml;base64,${btoa(turnRightSVG)}`;
import { UseSignal } from '@jupyterlab/apputils';
import { Button } from '@jupyterlab/ui-components';
import { Poll } from '@lumino/polling';
const LONG_PRESS_THRESHOLD = 1000;

export interface IMoveHubControlProps {
  device: MoveHub;
}

export function Telecommand({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  let pressStartTime: number = 0;
  let pressDuration: number = 0;
  let poll: Poll | null = null;

  const handleMouseDown = () => {
    pressStartTime = Date.now();

    poll = new Poll({
      auto: true,
      name: 'click-duration-polling',
      factory: async () => {
        pressDuration = Date.now() - pressStartTime;
      },
      frequency: {
        interval: 100,
        backoff: true
      },
      standby: 'when-hidden'
    });

    poll.start();
  };

  const handleMouseUp = async (action: string, direction: number) => {
    if (poll) {
      poll.stop();
    }
    if (action === 'inactive') {
      console.error('Inactive button, no control available.');
    }
    if (action === 'stop') {
      device.stop();
    }

    if (pressDuration < LONG_PRESS_THRESHOLD) {
      if (action === 'drive') {
        await device.hub.drive(20 * direction);
      } else if (action === 'turn') {
        await device.hub.turn(90 * direction);
      }
    } else {
      if (action === 'drive') {
        await device.hub.driveToDirection(direction);
      } else if (action === 'turn') {
        await device.hub.turn(3600 * direction);
      }
    }
  };

  const handleMouseLeave = () => {
    if (poll) {
      poll.stop();
    }
  };

  const images = [
    {
      id: 1,
      src: arrowUpSVGUrl,
      alt: 'Image 2',
      action: 'drive',
      direction: 1,
      handleMouseDown: handleMouseDown,
      handleMouseUp: handleMouseUp,
      handleMouseLeave: handleMouseLeave
    },
    {
      id: 2,
      src: turnLeftSVGUrl,
      action: 'turn',
      direction: -1,
      alt: 'Image 4',
      handleMouseDown: handleMouseDown,
      handleMouseUp: handleMouseUp,
      handleMouseLeave: handleMouseLeave
    },
    {
      id: 3,
      src: stopSVGUrl,
      alt: 'Image 5',
      action: 'stop',
      direction: 0,
      handleMouseDown: handleMouseDown,
      handleMouseUp: handleMouseUp,
      handleMouseLeave: handleMouseLeave
    },
    {
      id: 4,
      src: turnRightSVGUrl,
      alt: 'Image 6',
      action: 'turn',
      direction: 1,
      handleMouseDown: handleMouseDown,
      handleMouseUp: handleMouseUp,
      handleMouseLeave: handleMouseLeave
    },
    {
      id: 5,
      src: arrowDownSVGUrl,
      alt: 'Image 8',
      action: 'drive',
      direction: -1,
      handleMouseDown: handleMouseDown,
      handleMouseUp: handleMouseUp,
      handleMouseLeave: handleMouseLeave
    }
  ];

  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title"> Remote control</h2>
      <div className="dashboard-card-muted">
        Short press: drive 20 cm or turn 90°
      </div>
      <div className="dashboard-card-muted">
        Long press (over 1 s): keep moving
      </div>
      <section className="motor-control">
        <UseSignal signal={themeManager.themeChanged}>
          {(): JSX.Element => (
            <div className="telecommand-grid">
              {images.map((image, index) => (
                <Button
                  key={index}
                  onMouseDown={image.handleMouseDown}
                  onMouseUp={e => {
                    handleMouseUp(image.action, image.direction);
                  }}
                  onMouseLeave={image.handleMouseLeave}
                  className="telecommand-button"
                >
                  <img src={image.src} alt={image.alt} />
                </Button>
              ))}
            </div>
          )}
        </UseSignal>
      </section>
    </section>
  );
}
