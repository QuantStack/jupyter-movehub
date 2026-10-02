import React from 'react';
import { IMoveHubPanelProps } from './MoveHubPanel';
import ColoredCircleWithText from './ColoredCircleWithText';
import { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo, MoveHub } from '../moveHub';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Menu } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
export const connectMoveHub = 'jupyter-movehub:connect-movehub';
export const disconnectMoveHub = 'jupyter-movehub:disconnect-movehub';

export default function ConnectionStatus({ device }: IMoveHubPanelProps) {
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

  return deviceState.connected ? (
    <ColoredCircleWithText color={'green'} text={''} />
  ) : (
    <ColoredCircleWithText color={'red'} text={''} />
  );
}

export class ConnectionStatusWidget extends ReactWidget {
  public device: MoveHub;
  public menu: Menu;

  constructor(device: MoveHub, commands: CommandRegistry) {
    super();
    this.device = device;
    const deviceID = this.device.native.id;

    this.menu = new Menu({ commands: commands });
    this.menu.addItem({
      command: disconnectMoveHub,
      args: { deviceID }
    });
    this.menu.addItem({
      command: connectMoveHub,
      args: { deviceID }
    });
    this.menu.addClass('jp-connection-status-menu');
  }

  openMenu(event: React.MouseEvent<HTMLDivElement>) {
    if (this.menu && typeof this.menu.isVisible !== 'undefined') {
      this.menu.open(event.clientX, event.clientY);
    } else {
      console.error('Menu or isVisible property is undefined');
    }
  }

  render() {
    return (
      <div
        title="Open Connection Status Menu"
        onClick={event => this.openMenu(event)}
        className="jp-connection-status-button"
      >
        <ConnectionStatus device={this.device} />
      </div>
    );
  }
}
