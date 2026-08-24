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

export type State = 'Turn' | 'Drive' | 'Stop' | 'Back' | 'Manual' | 'Seek';

export type Motor = 'A' | 'B';

export type TurnDirection = 'left' | 'right';

export type Port = {
  action: string | undefined;
  value: number | string;
};

/** Information from Lego Boost motors and sensors */
export type DeviceInfo = {
  ports: {
    A: Port;
    B: Port;
    AB: Port;
    C: Port;
    D: Port;
    LED: Port;
  };
  tilt: { roll: number; pitch: number; yaw: number };
  distance: number;
  rssi: number;
  color: string;
  error: string;
  connected: boolean;
  err?: any;
  ledColor: string | undefined;
  batteryLevel: number | undefined;
  identifier: string;
  primaryMACAddress: string | undefined;
};

/** Input data to used on manual and AI control */
export type ControlData = {
  input: string | null;
  speed: number;
  turnAngle: number;
  turnDirection?: TurnDirection;
  tilt: { roll: number; pitch: number; yaw: number };
  /** Force state change manually */
  forceState: State | null;
  /** Manually toggle input mode */
  updateInputMode: (controlData: ControlData) => void | null;
  /** Time stamp when control data was updated */
  controlUpdateTime?: number;
  state?: State;
  motorA?: number;
  motorB?: number;
};

export type RawData = {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9?: number;
  10?: number;
  11?: number;
  12?: number;
  13?: number;
  14?: number;
};
