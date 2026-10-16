import React from 'react';
import { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import BatteryGauge from 'react-battery-gauge';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo, MoveHub } from '../moveHub';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import { ReactWidget } from '@jupyterlab/ui-components';
import { IThemeManager } from '@jupyterlab/apputils';
import { UseSignal } from '@jupyterlab/apputils';

const batteryCustomizationLight = {
  batteryBody: {
    strokeWidth: 2,
    cornerRadius: 6,
    fill: 'none',
    strokeColor: '#111',
    width: '50px',
    padding: '0 20px'
  },
  batteryCap: {
    fill: 'none',
    strokeWidth: 2,
    strokeColor: '#111',
    cornerRadius: 2,
    capToBodyRatio: 0.4
  },
  batteryMeter: {
    fill: 'green',
    lowBatteryValue: 15,
    lowBatteryFill: 'red',
    outerGap: 1,
    noOfCells: 1,
    interCellsGap: 1
  },
  readingText: {
    lightContrastColor: '#111',
    darkContrastColor: '#fff',
    lowBatteryColor: 'red',
    fontFamily: 'Helvetica',
    fontSize: 20,
    showPercentage: true // Set to true to show battery percentage
  }
};

const batteryCustomizationDark = {
  batteryBody: {
    strokeWidth: 2,
    cornerRadius: 6,
    fill: 'none',
    strokeColor: 'white',
    width: '50px',
    padding: '0 20px'
  },
  batteryCap: {
    fill: 'none',
    strokeWidth: 2,
    strokeColor: 'white',
    cornerRadius: 2,
    capToBodyRatio: 0.4
  },
  batteryMeter: {
    fill: 'green',
    lowBatteryValue: 15,
    lowBatteryFill: 'red',
    outerGap: 1,
    noOfCells: 1,
    interCellsGap: 1
  },
  readingText: {
    lightContrastColor: '#111',
    darkContrastColor: '#fff',
    lowBatteryColor: 'red',
    fontFamily: 'Helvetica',
    fontSize: 20,
    showPercentage: true // Set to true to show battery percentage
  }
};

export default function Battery({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);
  const theme = themeManager.theme;

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: 'device-status-polling',
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

  if (theme) {
    const isThemeLight = themeManager.isLight(theme);
    return (
      <UseSignal signal={themeManager.themeChanged}>
        {(): JSX.Element =>
          deviceState.batteryLevel !== undefined &&
          deviceState.connected === true ? (
            <BatteryGauge
              value={deviceState.batteryLevel}
              width={'50px'}
              customization={
                isThemeLight
                  ? batteryCustomizationLight
                  : batteryCustomizationDark
              }
            />
          ) : (
            <div></div>
          )
        }
      </UseSignal>
    );
  } else {
    return deviceState.batteryLevel !== undefined &&
      deviceState.connected === true ? (
      <BatteryGauge
        value={deviceState.batteryLevel}
        customization={batteryCustomizationLight}
      />
    ) : (
      <div></div>
    );
  }
}

export class BatteryWidget extends ReactWidget {
  public device: MoveHub;
  public themeManager: IThemeManager;

  constructor(device: MoveHub, themeManager: IThemeManager) {
    super();
    this.device = device;
    this.themeManager = themeManager;
  }

  render() {
    return <Battery device={this.device} themeManager={this.themeManager} />;
  }
}
