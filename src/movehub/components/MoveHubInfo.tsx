import React from 'react';
import { MoveHub } from '../moveHub';
import DeviceInfoCard from './DeviceInfoCard';
import Sensors from './Sensors';
import MotorControl, { MotorPort } from './MotorControl';

const PORTS: MotorPort[] = ['A', 'B', 'C', 'D'];

/**
 * The Move Hub info cards shown by the notebook widget: sensors, device
 * information and the current angle of each port, without any controls
 * operating the motors. The port cards are stacked in a single column
 * next to the device and sensors cards.
 */
export default function MoveHubInfo({ moveHub }: { moveHub: MoveHub }) {
  return (
    <div className="dashboard">
      <div className="dashboard-row">
        <DeviceInfoCard device={moveHub} />
        <Sensors device={moveHub} />
        <div className="dashboard-ports">
          {PORTS.map(port => (
            <MotorControl key={port} device={moveHub} port={port} readOnly />
          ))}
        </div>
      </div>
    </div>
  );
}
