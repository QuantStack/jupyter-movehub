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
import {
  IBluetoothManager,
  PairingInfoWidget
} from '@jupyter-bluetooth-manager/bluetooth';
import { Dialog } from '@jupyterlab/apputils';
import { movehubRegistryItem } from '.';
import { MoveHub } from '../movehub/moveHub';
import {
  IScheduledJobHandle,
  TaskCancelledError
} from '../movehub/movehub-control/taskScheduler';
// @ts-expect-error To be fixed
import * as ReactDOMClient from 'react-dom/client';
// @ts-expect-error To be fixed
import { Root } from 'react-dom/client';
import MoveHubWidgetView from '../movehub/components/MoveHubWidgetView';

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
    // Update the frontend view.
    this.set('_device_info', device_info);

    // Push the device info to the kernel over the custom comm channel.
    // The widget state sync path is throttled by ipywidgets to one
    // in-flight message, released only by a kernel idle status
    // acknowledgment; on some stacks the acknowledgment never arrives
    // and every state update stays buffered forever. Custom messages
    // are not throttled.
    // See https://github.com/jupyter-widgets/ipywidgets/issues/4048
    try {
      this.send({ event: 'device-info', data: device_info as any });
    } catch (err) {
      // The comm is dead (kernel restart or closed comm): no kernel
      // side remains to receive device info updates, so stop the
      // polling loop instead of failing on every tick.
      console.warn(
        'Stopping device info polling: cannot send to the kernel',
        err
      );
      this.stop_polling = true;
    }
  }

  poll() {
    this.polling_frame += 1;
    this.save_device_info();
  }

  polling() {
    // The polling loop must survive exceptions (e.g. a failed render of
    // the device info view): a single unhandled error would otherwise
    // stop the `_device_info` updates and hang every task awaiting a
    // device info change.
    try {
      this.poll();
    } catch (err) {
      console.error('Device info polling failed', err);
    }
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
            const movehub = this.movehub as MoveHub | undefined;
            if (movehub === undefined || !movehub.deviceInfo.connected) {
              throw new Error(
                'The Move Hub is not connected. Connect it before sending commands.'
              );
            }

            // Motor and LED tasks are scheduled by the MoveHub: commands
            // targeting overlapping ports are executed in order, commands
            // on disjoint ports run in parallel.
            let job: IScheduledJobHandle | null = null;
            switch (content.task_type) {
              case 'motor-time':
                job = this.movehub.motorTimeJob(
                  content.data.port,
                  content.data.seconds,
                  content.data.power,
                  content.data.wait
                );
                break;

              case 'motor-angle':
                job = this.movehub.motorAngleJob(
                  content.data.port,
                  content.data.angle,
                  content.data.power,
                  content.data.wait
                );
                break;

              case 'motor-angle-multi':
                job = this.movehub.motorAngleMultiJob(
                  content.data.angle,
                  content.data.power_a,
                  content.data.power_b,
                  content.data.wait
                );
                break;

              case 'motor-time-multi':
                job = this.movehub.motorTimeMultiJob(
                  content.data.seconds,
                  content.data.power_a,
                  content.data.power_b,
                  content.data.wait
                );
                break;

              case 'set-led':
                job = this.movehub.ledJob(content.data.color);
                break;

              default:
                console.error('Unknown task type.');
                break;
            }

            if (job) {
              this.tasks.set(content.task_uuid, job);
              try {
                await job.promise;
              } finally {
                this.tasks.delete(content.task_uuid);
              }
            }

            this.send({
              event: 'task-finished',
              task_uuid: content.task_uuid,
              task_type: content.task_type
            });
          } catch (err) {
            const isCancelled = err instanceof TaskCancelledError;
            if (!isCancelled) {
              console.error(
                'task failed for',
                content.task_uuid,
                content.task_type,
                err
              );
            }
            try {
              this.send({
                event: isCancelled ? 'task-cancelled' : 'task-failed',
                task_uuid: content.task_uuid,
                task_type: content.task_type,
                error: String(err)
              });
            } catch (e) {
              console.error(
                isCancelled
                  ? 'failed to send cancel for'
                  : 'failed to send failure of',
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
            const job = this.tasks.get(content.task_uuid);
            if (job) {
              // The running or queued task is aborted; the `task-cancelled`
              // message is sent once the task promise rejects.
              job.cancel();
            } else {
              // The task is not scheduled (connect, disconnect) or it has
              // already finished.
              this.send({
                event: 'task-cancelled',
                task_uuid: content.task_uuid
              });
            }
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
      // Show the pairing information while the browser device chooser
      // is open, like the connect command does.
      const body = new PairingInfoWidget(movehubRegistryItem.pairingInfo);
      const dialog = new Dialog({
        title: 'Pairing information',
        body: body,
        buttons: [Dialog.okButton({ label: 'Close' })]
      });
      try {
        dialog.launch();
        this.movehub = (await MoveHubModel.bluetoothManager.connect(
          movehubRegistryItem
        )) as MoveHub;
      } finally {
        dialog.resolve();
      }
      if (!this.movehub) {
        // The user cancelled the device chooser without selecting a
        // device: nothing to connect to.
        return;
      }
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
  private tasks = new Map<string, IScheduledJobHandle>();
  private polling_frame = 0;
  private polling_is_running = false;
  stop_polling = false;

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

    // Listen for changes to _device_info and re-render
    this.listenTo(model, 'change:_device_info', () => {
      this.updateRender();
    });

    this.updateRender();
  }

  private updateRender() {
    const model = this.model as MoveHubModel;
    const moveHub = model.movehub;
    const areDevicesConnected =
      MoveHubModel.bluetoothManager.deviceList.length !== 0;
    this.root?.render(
      <MoveHubWidgetView
        areMoveHubsAlreadyConnected={areDevicesConnected}
        bluetoothManager={MoveHubModel.bluetoothManager}
        moveHub={moveHub}
      />
    );
  }

  remove() {
    this.root?.unmount();
    // Drop the reference so that a late `change:_device_info` cannot
    // render on the unmounted root ("Cannot update an unmounted root").
    this.root = null;
    // Unsubscribe the view from the model events; without this, the
    // removed view would keep reacting to device info updates.
    super.remove();
  }
}
