import React, { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import { COLOR_HEX } from '../types';
import MoveHub from './MoveHub';

export const colors = [
  'off',
  'pink',
  'purple',
  'blue',
  'lightblue',
  'cyan',
  'green',
  'yellow',
  'orange',
  'red',
  'white'
];

const label = (color: string): string =>
  color === 'lightblue'
    ? 'Light blue'
    : color.charAt(0).toUpperCase() + color.slice(1);

export function MoveHubLed({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    device.deviceInfo.ledColor || undefined
  );

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: 'led-color-polling',
      factory: async () => {
        setSelectedColor(device.deviceInfo.ledColor || undefined);
      },
      frequency: {
        interval: 500,
        backoff: true
      },
      standby: 'when-hidden'
    });

    poll.start();

    return () => {
      poll.stop();
    };
  }, [device]);

  const hub = device.hub;
  if (!hub || !hub.emitter || !hub.ledAsync) {
    console.error('Hub is not properly initialized:', hub);
    return <div>Error: Hub is not initialized</div>;
  }

  const handleColorChange = async (color: string) => {
    try {
      await hub.ledAsync(color);
      setSelectedColor(color);
      device.deviceInfo = {
        ...device.deviceInfo,
        ledColor: color
      };
    } catch (error) {
      console.error('Failed to change LED color:', error);
    }
  };

  return (
    <section className="dashboard-card" style={{ justifyContent: 'center' }}>
      <h2 className="dashboard-card-title">Move Hub</h2>

      <MoveHub themeManager={themeManager} />

      <div className="led-color">
        <div className="led-color-header">
          <span className="led-color-current">
            LED:{' '}
            <strong>{selectedColor ? label(selectedColor) : 'Unknown'}</strong>
          </span>
        </div>

        <div className="led-color-swatches" role="group" aria-label="LED color">
          {colors.map(color => (
            <button
              key={color}
              type="button"
              className={`led-color-swatch ${color === selectedColor ? 'selected' : ''}`}
              style={{ background: COLOR_HEX[color] }}
              aria-label={label(color)}
              aria-pressed={color === selectedColor}
              title={label(color)}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
