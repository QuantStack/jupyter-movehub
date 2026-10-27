import React from 'react';
import { IBluetoothManager } from '@jupyter-bluetooth-manager/bluetooth';
import { MoveHubList } from './MoveHubList';
import MoveHubInfo from './MoveHubInfo';
import { MoveHub } from '../moveHub';

interface IMoveHubViewProps {
  bluetoothManager: IBluetoothManager;
  areMoveHubsAlreadyConnected: boolean;
  moveHub: MoveHub | undefined;
}

export default function MoveHubWidgetView({
  areMoveHubsAlreadyConnected,
  bluetoothManager,
  moveHub
}: IMoveHubViewProps) {
  if (areMoveHubsAlreadyConnected === true) {
    return (
      <>
        {!moveHub ? (
          <>
            <div>
              Warning: there are already one or more Move Hubs connected. If you
              want to use one of them, you can copy paste its ID from the
              clipboard:{' '}
            </div>
            <MoveHubList bluetoothManager={bluetoothManager} />
          </>
        ) : (
          <MoveHubInfo moveHub={moveHub} />
        )}
      </>
    );
  } else {
    return (
      <>
        {!moveHub ? (
          <div>
            Warning: there is no device connected yet. Please call connect
            method on your widget instance.
          </div>
        ) : (
          <MoveHubInfo moveHub={moveHub} />
        )}
      </>
    );
  }
}
