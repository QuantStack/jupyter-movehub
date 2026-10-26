import React from 'react';
import { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo } from '../moveHub';
import { IMoveHubPanelProps } from './MoveHubPanel';
import ColoredCircleWithText from './ColoredCircleWithText';
import { CopyButton } from './CopyToClipboard';

const LOW_BATTERY_LEVEL = 15;

export default function DeviceInfoCard({ device }: IMoveHubPanelProps) {
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: 'device-info-polling',
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
  const batteryLevel = deviceState.batteryLevel;
  const lowBattery =
    batteryLevel !== undefined && batteryLevel <= LOW_BATTERY_LEVEL;

  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title">Device</h2>
      <div className="device-info-row">
        <span className="dashboard-card-muted">Status</span>
        <ColoredCircleWithText
          color={connected ? 'green' : 'red'}
          text={connected ? 'connected' : 'disconnected'}
        />
      </div>
      <div className="device-info-row">
        <span className="dashboard-card-muted">MAC address</span>
        <div className="device-info-value-with-copy">
          <span className="dashboard-card-text">
            {deviceState.primaryMACAddress ?? '—'}
          </span>
          {deviceState.primaryMACAddress && (
            <CopyButton
              textToCopy={deviceState.primaryMACAddress}
              title="Copy the MAC address to the clipboard"
              className="device-info-copy-button"
            />
          )}
        </div>
      </div>
      <div className="device-info-row">
        <span className="dashboard-card-muted">Identifier</span>
        <div className="device-info-value-with-copy">
          <span className="dashboard-card-text">{device.native.id}</span>
          <CopyButton
            textToCopy={device.native.id}
            title="Copy the device identifier to the clipboard"
            className="device-info-copy-button"
          />
        </div>
      </div>
      <div className="device-info-row">
        <span className="dashboard-card-muted">Battery</span>
        <span className="dashboard-card-text">
          {batteryLevel !== undefined ? `${batteryLevel}%` : '—'}
        </span>
      </div>
      {batteryLevel !== undefined && (
        <div
          className="device-info-bar"
          role="meter"
          aria-label="Battery level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={batteryLevel}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, batteryLevel))}%`,
              background: lowBattery ? 'var(--jp-error-color1)' : undefined
            }}
          />
        </div>
      )}
    </section>
  );
}
