import React from 'react';
import {
  BluetoothManager,
  IBluetoothManager
} from '@jupyter-bluetooth-manager/bluetooth';
import CopyToClipboard from './CopyToClipboard';

interface IDeviceListProps {
  bluetoothManager: IBluetoothManager;
}

export function MoveHubList({ bluetoothManager }: IDeviceListProps) {
  const listItems = bluetoothManager.deviceList.map(
    (item: BluetoothManager.Device, index) => (
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', height: '30px'
          }}>Move Hub ID:</div> <CopyToClipboard textToCopy={item.native.id} />
        </div>
      </>
    )
  );
  return <ul>{listItems}</ul>;
}
