/* Distributed under the terms of the Modified BSD License.

# This file comes from https://github.com/jupyter-robotics/ipylgbst and has been adapted for the current extension
#
# It is licensed under the following license:
#
# BSD License

Copyright (c) Dr Thorsten Beier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
*/
import React from 'react';
import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { IBluetoothManager } from '@jupyter-bluetooth-manager/bluetooth';
import { movehubRegistryItem } from '.';
import { MoveHub } from '../movehub/moveHub';
// @ts-expect-error To be fixed
import * as ReactDOMClient from 'react-dom/client';
// @ts-expect-error To be fixed
import { Root } from 'react-dom/client';
//import { DeviceInfoTableComplete } from './components/DeviceInfoTableComplete';
import MoveHubViewComponent from '../movehub/components/MoveHubView';

// we use globals for the movehub device since connecting to
// them takes a long time. If the model would hold the
// movehub instance, we would need to re-connect any time
// we restart the kernel.

export class MoveHubModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: MoveHubModel.model_name,
      _model_module: MoveHubModel.model_module,
      _model_module_version: MoveHubModel.model_module_version,
      _view_name: MoveHubModel.view_name,
      _view_module: MoveHubModel.view_module,
      _view_module_version: MoveHubModel.view_module_version,
      _device_info: {},
      name: 'device1',
      identifier: ''
    };
  }

  private save_device_info() {
    const device_info = {
      polling_frame: this.polling_frame,
      ...this.movehub.deviceInfo
    };
    this.set('_device_info', device_info);
    this.save_changes();
  }

  poll() {
    this.polling_frame += 1;
    this.save_device_info();
  }

  polling() {
    this.poll();
    if (!this.stop_polling) {
      this.polling_is_running = true;
      setTimeout(this.polling.bind(this), 16);
    } else {
      this.polling_is_running = false;
    }
  }

  initialize(attributes: any, options: any) {
    super.initialize(attributes, options);
    const name: string = this.get('name');
    console.log(`initialize with name=${name}`);
    //console.log("deviceInfo:", this.movehub.deviceInfo)

    this.on('msg:custom', async (content: any) => {
      switch (content.event) {
        case 'start-task':
          console.log(`Received ${content.task_type} task`);

          try {
            // Connect is always allowed if the device is not already connected
            if (
              /* !this.movehub.deviceInfo.connected &&*/
              content.task_type === 'connect'
            ) {
              await this.connect();

              this.send({
                event: 'task-finished',
                task_uuid: content.task_uuid,
                task_type: content.task_type
              });
              return;
            }

            // Disconnect can also be called even if already disconnected
            if (
              /*this.movehub.deviceInfo.connected &&*/
              content.task_type === 'disconnect'
            ) {
              this.disconnect();

              this.send({
                event: 'task-finished',
                task_uuid: content.task_uuid,
                task_type: content.task_type
              });
              return;
            }

            // All other commands require a connection
            /*if (!this.movehub.deviceInfo.connected) {
              throw new Error('Boost is not connected.');
            }*/

            switch (content.task_type) {
              case 'motor-time':
                await this.movehub.motorTimeAsync(
                  content.data.port,
                  content.data.seconds,
                  content.data.power,
                  content.data.wait
                );
                break;

              case 'motor-angle':
                await this.movehub.motorAngleAsync(
                  content.data.port,
                  content.data.angle,
                  content.data.power,
                  content.data.wait
                );
                break;

              case 'motor-angle-multi':
                await this.movehub.motorAngleMultiAsync(
                  content.data.angle,
                  content.data.power_a,
                  content.data.power_b,
                  content.data.wait
                );
                break;

              case 'motor-time-multi':
                await this.movehub.motorTimeMultiAsync(
                  content.data.seconds,
                  content.data.power_a,
                  content.data.power_b,
                  content.data.wait
                );
                break;

              case 'set-led':
                await this.movehub.ledAsync(content.data.color);
                break;

              default:
                console.error('Unknown task type.');
                break;
            }

            this.send({
              event: 'task-finished',
              task_uuid: content.task_uuid,
              task_type: content.task_type
            });
          } catch (err) {
            console.error(
              'task failed for',
              content.task_uuid,
              content.task_type,
              err
            );
            try {
              this.send({
                event: 'task-cancelled',
                task_uuid: content.task_uuid,
                task_type: content.task_type,
                error: String(err)
              });
            } catch (e) {
              console.error(
                'failed to send cancel for',
                content.task_uuid,
                content.task_type,
                e
              );
            }
          }
          break;
      }
      switch (content.event) {
        case 'cancel-task':
          try {
            if (
              content.task_type === 'motor-time' ||
              content.task_type === 'motor-angle' ||
              content.task_type === 'motor-time-multi' ||
              content.task_type === 'motor-angle-multi'
            ) {
              // common stop: zero-power motors
              this.movehub.motorTimeMulti(0, 0, 0);
            }
            if (content.task_type === 'set-led') {
              // common stop: turn off led
              this.movehub.led('off');
            }
            this.send({
              event: 'task-cancelled',
              task_uuid: content.task_uuid
            });
          } catch (err) {
            console.error(
              'task cancel failed for',
              content.task_uuid,
              content.task_type,
              err
            );
          }
          break;
      }
    });
  }

  async connect() {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const identifier = this.get('identifier');

    if (identifier === '') {
      this.movehub =
        await MoveHubModel.bluetoothManager.connect(movehubRegistryItem);
    } else {
      const selectedDevice = MoveHubModel.bluetoothManager.deviceList.find(
        device => device.native.id === identifier
      );
      if (selectedDevice && selectedDevice instanceof MoveHub) {
        this.movehub = selectedDevice;
      }
      for (let i = 0; i < 30; i++) {
        await sleep(100);
        if (
          this.movehub.deviceInfo.connected &&
          this.movehub.hub !== undefined &&
          this.movehub.hub.connected
        ) {
          break;
        }
      }
      await sleep(4000);
    }

    if (!this.polling_is_running) {
      this.polling_is_running = true;
      setTimeout(this.polling.bind(this), 200);
    }
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers
    // Add any extra serializers here
  };

  disconnect() {
    console.log('disconnect');
    this.movehub.disconnect();
  }

  dispose() {
    console.log('remove model');
  }

  movehub: MoveHub;
  private polling_frame = 0;
  private polling_is_running = false;
  stop_polling = false;
  //private currentProcessing: Promise<void> = Promise.resolve();

  static model_name = 'MoveHubModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'MoveHubView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
  static bluetoothManager: IBluetoothManager;
}

export class MoveHubView extends DOMWidgetView {
  private root: Root | null = null;

  async render() {
    this.el.classList.add('jupyter-react-widget');
    this.root = ReactDOMClient.createRoot(this.el);
    const model = this.model as MoveHubModel;
    const moveHub = model.movehub;
    const areDevicesConnected =
      MoveHubModel.bluetoothManager.deviceList.length !== 0;
    this.root.render(
      <MoveHubViewComponent
        areMoveHubsAlreadyConnected={areDevicesConnected}
        bluetoothManager={MoveHubModel.bluetoothManager}
        moveHub={moveHub}
      />
    );
  }
  remove() {
    this.root?.unmount();
  }
}
