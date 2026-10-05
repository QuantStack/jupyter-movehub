/*# Distributed under the terms of the Modified BSD License.

# This file comes from https://github.com/ttu/lego-boost-browser
#
# It is licensed under the following license:
#
# MIT License

Copyright (c) 2018 Tomi Tuhkanen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { IDeviceConfiguration, HubAsync } from './hub/hubAsync';
import { ControlData, DeviceInfo, State } from './types';

type States = {
  [key in State]: (hub: HubControl) => void;
};

class HubControl {
  hub: HubAsync | null;
  deviceInfo: DeviceInfo;
  prevDevice: DeviceInfo;
  control: ControlData;
  prevControl: ControlData;
  configuration: IDeviceConfiguration;
  states: States;

  constructor(
    deviceInfo: DeviceInfo,
    controlData: ControlData,
    configuration: IDeviceConfiguration
  ) {
    this.hub = null;
    this.deviceInfo = deviceInfo;
    this.control = controlData;
    this.configuration = configuration;
    this.prevControl = { ...this.control };
  }

  updateConfiguration(configuration: IDeviceConfiguration): void {
    this.configuration = configuration;
  }

  async start(hub: HubAsync) {
    this.hub = hub;
    this.deviceInfo.connected = true;

    this.hub.emitter.on('error', (err: any) => {
      this.deviceInfo.err = err;
    });

    this.hub.emitter.on('disconnect', () => {
      this.deviceInfo.connected = false;
    });

    this.hub.emitter.on('distance', (distance: any) => {
      this.deviceInfo.distance = distance;
    });

    this.hub.emitter.on('rssi', (rssi: any) => {
      this.deviceInfo.rssi = rssi;
    });

    this.hub.emitter.on('port', (portObject: any) => {
      const { port, action } = portObject;
      this.deviceInfo.ports[
        port as 'A' | 'B' | 'AB' | 'C' | 'D' | 'LED'
      ].action = action;
    });

    this.hub.emitter.on('color', (color: any) => {
      this.deviceInfo.color = color;
    });

    this.hub.emitter.on('tilt', (tilt: any) => {
      const { roll, pitch, yaw } = tilt;
      this.deviceInfo.tilt.roll = roll;
      this.deviceInfo.tilt.pitch = pitch;
      this.deviceInfo.tilt.yaw = yaw;
    });

    this.hub.emitter.on(
      'rotation',
      (rotation: { port: keyof DeviceInfo['ports']; angle: number }) => {
        const { port, angle } = rotation;
        this.deviceInfo.ports[port].value = angle;
      }
    );

    this.hub.emitter.on('ledColor', (ledColor: any) => {
      this.deviceInfo.ledColor = ledColor;
    });

    await this.hub.ledAsync('red');
    await this.hub.ledAsync('yellow');
    await this.hub.ledAsync('green');
    this.deviceInfo.ledColor = 'green';
    this.deviceInfo.batteryLevel = this.hub.batteryLevel;
    this.deviceInfo.primaryMACAddress = this.hub.primaryMACAddress;
    this.hub.emitter.on('batteryLevel', (batteryLevel: any) => {
      if (this.hub?.batteryLevel) {
        this.deviceInfo.batteryLevel = this.hub.batteryLevel;
      }
    });
  }

  async disconnect() {
    if (this.deviceInfo.connected) {
      await this.hub?.disconnectAsync();
    }
  }

  update() {
    // TODO: After removing bind, this requires some more refactoring

    // TODO: Deep clone
    this.prevControl = { ...this.control };
    this.prevControl.tilt = { ...this.control.tilt };
    this.prevDevice = { ...this.deviceInfo };
  }
}

export { HubControl };
