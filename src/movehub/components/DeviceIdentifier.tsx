import React from 'react';
import { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo, MoveHub } from '../moveHub';
import { IMoveHubPanelProps } from './MoveHubPanel';
import { ReactWidget } from '@jupyterlab/ui-components';
import { CopyButton } from './CopyToClipboard';

export default function DeviceIdentifier({ device }: IMoveHubPanelProps) {
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);

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

  return deviceState.connected === true ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        padding: '0 10px'
      }}
    >
      <span className="device-identifier-label">ID:</span>
      <span>{device.native.id}</span>
      <CopyButton
        textToCopy={device.native.id}
        title="Copy the device ID to the clipboard"
      />
      {deviceState.primaryMACAddress && (
        <>
          <span
            className="device-identifier-label"
            style={{ paddingLeft: '10px' }}
          >
            MAC:
          </span>
          <span>{deviceState.primaryMACAddress}</span>
          <CopyButton
            textToCopy={deviceState.primaryMACAddress}
            title="Copy the MAC address to the clipboard"
          />
        </>
      )}
    </div>
  ) : (
    <div style={{ width: '230px' }}> </div>
  );
}

export class DeviceIdentifierWidget extends ReactWidget {
  public device: MoveHub;

  constructor(device: MoveHub) {
    super();
    this.device = device;
  }

  render() {
    return <DeviceIdentifier device={this.device} />;
  }
}
