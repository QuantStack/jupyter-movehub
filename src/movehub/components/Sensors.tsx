import React from 'react';
import { useEffect, useState } from 'react';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo } from '../moveHub';
import { Poll } from '@lumino/polling';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import { MOVE_HUB_COLORS } from '../types';

const MAX_DISTANCE = 182;
const INFINITY = '\u221E';

function PitchRowYaw({
  label,
  value,
  range
}: {
  label: string;
  value?: number;
  range: number;
}) {
  const v = value ?? 0;
  const clamped = Math.max(-range, Math.min(range, v));
  const pos = ((clamped + range) / (2 * range)) * 100;
  return (
    <div className="tilt-sensor-row">
      <span className="dashboard-card-muted">{label}</span>
      <div
        className="tilt-track"
        role="meter"
        aria-label={label}
        aria-valuemin={-range}
        aria-valuemax={range}
        aria-valuenow={v}
      >
        <div className="tilt-center" />
        <div
          className="tilt-thumb"
          style={{ left: `calc(${pos.toFixed(1)}% - 2px)` }}
        />
      </div>
      <span className="dashboard-card-text">
        {value !== undefined ? `${value}°` : '—'}
      </span>
    </div>
  );
}

export default function Sensors({ device }: IMoveHubPanelWithThemeProps) {
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
  const { tilt, distance, color } = deviceState;
  const inRange = distance !== undefined && distance < MAX_DISTANCE;
  const distanceText = inRange ? String(distance) : INFINITY;
  const normalized = (color ?? '').toLowerCase().replace(/[\s_-]/g, '');
  const seen = MOVE_HUB_COLORS.find(
    color =>
      color.index !== 0 &&
      (color.id === normalized ||
        color.name.toLowerCase().replace(/\s/g, '') === normalized)
  );
  const distancePct =
    distance !== undefined ? Math.min(100, (distance / MAX_DISTANCE) * 100) : 0;
  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title">Sensors</h2>
      <div className="dashboard-card-subtitle">Tilt</div>
      <PitchRowYaw label="Roll" value={tilt?.roll} range={180} />
      <PitchRowYaw label="Pitch" value={tilt?.pitch} range={90} />
      <PitchRowYaw label="Yaw" value={tilt?.yaw} range={180} />

      <div className="divider" />

      <div className="dashboard-card-subtitle">Distance and color</div>
      <div className="tilt-sensor-row">
        <span className="dashboard-card-muted">Distance</span>
        <div className="distance-sensor-bar">
          <div style={{ width: `${distancePct}%` }} />
        </div>
        <span className="dashboard-card-text">
          {distanceText}
          {inRange && <span className="dashboard-card-muted"> mm</span>}
        </span>
      </div>

      <div className="color-sensor-row mod-spread">
        <div className="color-sensor">
          <div className="color-seen">
            <span className="dashboard-card-muted">{'Color seen'}</span>
            <span
              className={`color-chip ${seen ? '' : 'mod-empty'}`}
              style={seen ? { background: seen.hex } : undefined}
            />
            <span
              className={seen ? 'dashboard-card-text' : 'dashboard-card-muted'}
            >
              {seen ? seen.name : 'None detected'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
