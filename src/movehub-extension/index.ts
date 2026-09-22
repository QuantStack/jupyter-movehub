import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ITranslator } from '@jupyterlab/translation';
import { IThemeManager, MainAreaWidget } from '@jupyterlab/apputils';
import { Toolbar } from '@jupyterlab/ui-components';
import {
  BluetoothManager,
  IDeviceTypeRegistryItem,
  IBluetoothManager
} from '@jupyter-bluetooth-manager/bluetooth';
import { MoveHub } from '../movehub/moveHub';
import { LegoBrickIcon } from '../movehub/icon';
import { MoveHubPanelWidget } from '../movehub/components/MoveHubPanel';
import { LegoBuildSelectorWidget } from '../movehub/components/LegoBuildSelector';
import { BatteryWidget } from '../movehub/components/BatteryGauge';
import { DeviceIdentifierWidget } from '../movehub/components/DeviceIdentifier';
import { ConnectionStatusWidget } from '../movehub/components/ConnectionStatus';
import ipymovehubPlugin from './plugin';
import movehubPairingSVG from '../../style/images/MovehubPairing.svg';
const movehubPairingSVGUrl = `data:image/svg+xml;base64,${btoa(movehubPairingSVG)}`;
export const addMoveHubControlPanel =
  'jupyter-movehub:add-movehub-control-panel';
export const connectMoveHub = 'jupyter-movehub:connect-movehub';
export const disconnectMoveHub = 'jupyter-movehub:disconnect-movehub';
export const moveHubServiceUUID = '00001623-1212-efde-1623-785feabcd123';
export const moveHubCharacteristicUUID = '00001624-1212-efde-1623-785feabcd123';
//import { IDeviceOptions } from '@jupyter-bluetooth-manager/bluetooth';

/*export interface IDeviceTypeRegistryItem {
  deviceType: string;
  instructions: string;
  SVGUrl: string;
  withImage: boolean;
  imageAlt: string;
  factory: (
    native: BluetoothDevice
  ) => Promise<BluetoothManager.Device | undefined>;
  options: IDeviceOptions;
}*/

export const movehubRegistryItem: IDeviceTypeRegistryItem = {
  deviceType: 'LEGO® Move Hub',
  instructions: 'Please press the green button to pair the Movub.',
  SVGUrl: movehubPairingSVGUrl,
  withImage: true,
  imageAlt: 'Pairing instructions for the Movehub device.',
  options: {
    acceptAllDevices: false,
    filters: [{ services: [moveHubServiceUUID] }],
    optionalServices: [moveHubServiceUUID]
  },
  factory: async (native: BluetoothDevice) => {
    const device = new MoveHub(native);
    await device.initDevice();
    const hub = device.hub;

    if (!hub) {
      throw new Error('Hub initialization failed.');
    }
    return device;
  }
};

const MoveHubRegisterPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-movehub:movehub-register-plugin',
  description: 'Registers the move hub device and provides a factory.',
  requires: [IBluetoothManager],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    bluetoothManager: BluetoothManager
  ): void => {
    console.log('JupyterLab move-hub-register plugin is activated!');
    bluetoothManager.deviceTypeRegistry.added.connect(
      async (sender, movehubRegistryItem) => {
        console.warn(
          `New item from category ${movehubRegistryItem.deviceType} is added to the deviceType registry.`
        );
      }
    );
    bluetoothManager.deviceTypeRegistry.add(movehubRegistryItem);
  }
};

const MoveHubControlPanelPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-movehub:movehub-control-panel-plugin',
  description: 'Provides the ui to display informations on the Move Hub state.',
  requires: [ITranslator, IBluetoothManager, IThemeManager],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    bluetoothManager: BluetoothManager,
    themeManager: IThemeManager
  ): void => {
    console.log('JupyterLab movehub-control-panel plugin is activated!');
    const trans = translator.load('jupyterlab');

    app.commands.addCommand(addMoveHubControlPanel, {
      execute: args => {
        const result = bluetoothManager.deviceList.filter(
          device => device instanceof MoveHub
        );
        if (result) {
          const device = result[
            result.length - 1
          ] as MoveHub; /* the last added MoveHub device*/
          const content = new MoveHubPanelWidget(device, themeManager);
          content.addClass('jp-movehub-panel-content');
          const toolbar = new Toolbar();
          toolbar.addClass('jp-movehub-panel-toolbar');
          const main = new MainAreaWidget({ content, toolbar });
          main.addClass('jp-movehub-panel-main');
          main.toolbar.addItem(
            'connection-status',
            new ConnectionStatusWidget(device, app.commands)
          );
          main.toolbar.addItem(
            'select-lego-model',
            new LegoBuildSelectorWidget(device)
          );
          toolbar.addItem('spacer', Toolbar.createSpacerItem());
          main.toolbar.addItem(
            'battery-gauge',
            new BatteryWidget(device, themeManager)
          );
          main.toolbar.addItem(
            'device-identifier',
            new DeviceIdentifierWidget(device)
          );
          main.id = 'lego-movehub-control-panel';
          main.title.label = 'LEGO® Move Hub';
          main.title.closable = true;
          main.title.icon = LegoBrickIcon;
          app.shell.add(main, 'main');
        } else {
          throw new Error('The device is not a Move Hub.');
        }
      },
      caption: trans.__('Open a LEGO® Move Hub control panel'),
      label: trans.__('Open a LEGO® Move Hub Control Panel')
    });

    app.commands.addCommand(disconnectMoveHub, {
      execute: args => {
        const selectedDevice = bluetoothManager.deviceList.find(
          device => device.native.id === (args.deviceID as string)
        );
        if (selectedDevice && selectedDevice instanceof MoveHub) {
          bluetoothManager.disconnect(selectedDevice);
          return selectedDevice;
        } else {
          throw new Error('No device provided or device is invalid');
        }
      },
      caption: 'Disconnect MoveHub',
      label: 'Disconnect MoveHub',
      isEnabled: args => {
        const selectedDevice = bluetoothManager.deviceList.find(
          device => device.native.id === (args.deviceID as string)
        );
        if (
          selectedDevice &&
          selectedDevice instanceof MoveHub &&
          selectedDevice.deviceInfo.connected
        ) {
          return true;
        } else {
          return false;
        }
      }
    });

    app.commands.addCommand(connectMoveHub, {
      execute: args => {
        const newDevice = bluetoothManager.connect(movehubRegistryItem);
        return newDevice;
      },
      caption: 'Connect MoveHub',
      label: 'Connect MoveHub',
      isEnabled: args => {
        const selectedDevice = bluetoothManager.deviceList.find(
          device => device.native.id === (args.deviceID as string)
        );
        if (
          selectedDevice &&
          selectedDevice instanceof MoveHub &&
          selectedDevice.deviceInfo.connected
        ) {
          return false;
        } else {
          return true;
        }
      }
    });
  }
};

const MoveHubExtensionPlugins: JupyterFrontEndPlugin<any>[] = [
  MoveHubRegisterPlugin,
  MoveHubControlPanelPlugin,
  ipymovehubPlugin
];
export default MoveHubExtensionPlugins;
