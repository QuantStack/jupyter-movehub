import React from 'react';
import { IBluetoothManager } from '@jupyter-bluetooth-manager/bluetooth';
import { MoveHubList } from './MoveHubList';
import { DeviceInfoTableComplete } from './DeviceInfoTableComplete';
import { MoveHub } from '../moveHub';

interface IMoveHubViewProps {
  bluetoothManager: IBluetoothManager;
  areMoveHubsAlreadyConnected: boolean;
  moveHub: MoveHub | undefined;
}

export default function MoveHubViewComponent({
  areMoveHubsAlreadyConnected,
  bluetoothManager,
  moveHub
}: IMoveHubViewProps) {
  if (moveHub) {
    return <DeviceInfoTableComplete moveHub={moveHub} />;
  }

  if (areMoveHubsAlreadyConnected) {
    return (
      <>
        <div>
          Warning: there are already one or more Lego Move Hubs connected.
          If you want to use one of them, you can copy paste its ID from the
          clipboard:{' '}
        </div>
        <MoveHubList bluetoothManager={bluetoothManager} />
      </>
    );
  }

  return (
    <div>
      There is no device connected yet. Instantiate a new instance of the Move
      Hub class.
    </div>
  );
}
