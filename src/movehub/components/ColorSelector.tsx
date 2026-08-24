import React from 'react';
import { useState } from 'react';
import { IMoveHubPanelProps } from './MoveHubPanel';
import ColoredCircleWithText from './ColoredCircleWithText';

const colors = [
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

export function ColorSelector({ device }: IMoveHubPanelProps) {
  let defaultSelectedColor: string;
  if (device.deviceInfo.ledColor) {
    defaultSelectedColor = device.deviceInfo.ledColor;
  } else {
    defaultSelectedColor = 'undefined';
  }

  const [selectedColor, setSelectedColor] =
    useState<string>(defaultSelectedColor);

  const hub = device.hub;
  if (!hub || !hub.emitter || !hub.ledAsync) {
    console.error('Hub is not properly initialized:', hub);
    return <div>Error: Hub is not initialized</div>;
  }
  const handleColorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      if (selectedColor) {
        hub.ledAsync(event.target.value);
        setSelectedColor(event.target.value);
        device.deviceInfo = {
          ...device.deviceInfo,
          ledColor: event.target.value
        };
      }
    } catch (error) {
      console.error('Failed to change LED color:', error);
    }
  };

  return (
    <div>
      <h4
        style={{
          color: 'var(--jp-accept-color-normal)',
          margin: '0',
          padding: '0'
        }}
      >
        LED control
      </h4>
      <div className="led-color-main-container">
        <div className="led-color-text" style={{ display: 'flex' }}>
          <p style={{ margin: '8px 0px' }}>Current color</p>
          {selectedColor !== 'lightblue' ? (
            <ColoredCircleWithText color={selectedColor} text={''} />
          ) : (
            <ColoredCircleWithText color={selectedColor} text={''} />
          )}
        </div>
        <div className="led-color-selector-container">
          <select
            className="led-color-selector"
            id="led-color-selector"
            value={''}
            onChange={handleColorChange}
          >
            <option value="" selected hidden>
              Pick a color
            </option>
            {colors.map(color => (
              <option key={color} value={color}>
                {color !== 'lightblue' ? color : 'light blue'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
