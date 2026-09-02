import { HubAsync } from './moveHub/hub/hubAsync';
import { BluetoothManager } from '@jupyter-bluetooth-manager/bluetooth';
import { HubControl } from './moveHub/hub-control';
import { IDeviceConfiguration, DEFAULT_CONFIG } from './moveHub/hub/hubAsync';
import { ControlData, DeviceInfo, RawData } from './moveHub/types';
import {
  moveHubCharacteristicUUID,
  moveHubServiceUUID
} from '../movehub-extension';
import { buildCompleteIdentifier } from '@jupyter-bluetooth-manager/bluetooth';
import { ObservableValue } from '@jupyterlab/observables';

export const defaultConfiguration: IDeviceConfiguration = {
  distanceModifier: DEFAULT_CONFIG.METRIC_MODIFIER,
  turnModifier: DEFAULT_CONFIG.TURN_MODIFIER,
  defaultClearDistance: DEFAULT_CONFIG.DEFAULT_CLEAR_DISTANCE,
  defaultStopDistance: DEFAULT_CONFIG.DEFAULT_STOP_DISTANCE,
  leftMotor: DEFAULT_CONFIG.LEFT_MOTOR,
  rightMotor: DEFAULT_CONFIG.RIGHT_MOTOR,
  driveSpeed: DEFAULT_CONFIG.DRIVE_SPEED,
  turnSpeed: DEFAULT_CONFIG.TURN_SPEED
};

export const defaultDeviceInfo: DeviceInfo = {
  ports: {
    A: { action: '', value: 0 },
    B: { action: '', value: 0 },
    AB: { action: '', value: 0 },
    C: { action: '', value: 0 },
    D: { action: '', value: 0 },
    LED: { action: '', value: 0 }
  },
  tilt: { roll: 0, pitch: 0, yaw: 0 },
  distance: Number.MAX_SAFE_INTEGER,
  rssi: 0,
  color: '',
  error: '',

  connected: false,
  ledColor: 'blue',
  batteryLevel: undefined,
  identifier: '',
  primaryMACAddress: ''
};

export class MoveHub extends BluetoothManager.Device {
  public configuration: IDeviceConfiguration;
  public hub: HubAsync;
  public hubControl: HubControl;
  public controlData: ControlData;
  public deviceInfo: DeviceInfo;
  public defaultConfiguration: IDeviceConfiguration;
  public legoBuild: ObservableValue;

  /**
   * Input data to used on manual and AI control
   * @property MoveHub#controlData
   */
  constructor(native: BluetoothDevice) {
    super(native);
    this.controlData = {
      input: null,
      speed: 0,
      turnAngle: 0,
      tilt: { roll: 0, pitch: 0, yaw: 0 },
      forceState: null,
      updateInputMode: (controlData: ControlData) => null,
      controlUpdateTime: undefined,
      state: undefined
    };

    this.deviceInfo = defaultDeviceInfo;
    this.legoBuild = new ObservableValue('Move Hub');

    this.defaultConfiguration = {
      distanceModifier: DEFAULT_CONFIG.METRIC_MODIFIER,
      turnModifier: DEFAULT_CONFIG.TURN_MODIFIER,
      defaultClearDistance: DEFAULT_CONFIG.DEFAULT_CLEAR_DISTANCE,
      defaultStopDistance: DEFAULT_CONFIG.DEFAULT_STOP_DISTANCE,
      leftMotor: DEFAULT_CONFIG.LEFT_MOTOR,
      rightMotor: DEFAULT_CONFIG.RIGHT_MOTOR,
      driveSpeed: DEFAULT_CONFIG.DRIVE_SPEED,
      turnSpeed: DEFAULT_CONFIG.TURN_SPEED
    };
    this.contextCommands = [
      'jupyter-movehub:disconnect-movehub',
      'jupyter-movehub:add-movehub-control-panel'
    ];
    this.isConnected = false;
  }
  logDebug(message?: any, ...optionalParams: any[]): void {
    if (message) {
      //console.warn(message);
    } else {
      return;
    }
  }

  private preCheck(): boolean {
    if (!this.hub || this.hub.connected === false) {
      return false;
    }
    return true;
  }

  async initDevice(): Promise<void> {
    this.connected.connect(async (sender, connected: boolean) => {
      if (connected) {
        this.deviceInfo.connected = connected;
        this.isConnected = connected;
      }
      console.warn('The connection state is', this.isConnected);
      this.deviceInfo.identifier = buildCompleteIdentifier(this.native);
    });
    this.disconnected.connect(async (sender, disconnected: boolean) => {
      if (disconnected) {
        this.deviceInfo.connected = false;
        this.isConnected = false;
      }
      console.warn('The connection state is', this.isConnected);
    });

    const characteristic = await this.getCharacteristic(
      moveHubServiceUUID,
      moveHubCharacteristicUUID
    );

    // Initialize hub
    if (characteristic !== undefined) {
      this.hub = new HubAsync(characteristic, defaultConfiguration);
      this.hub.logDebug = this.logDebug;

      // Register events
      // Ensure hub is fully configured before returning
      this.hub.emitter.on('connect', () => {
        this.hub.afterInitialization();
        this.hubControl = new HubControl(
          this.deviceInfo,
          this.controlData,
          defaultConfiguration
        );
        this.hubControl.start(this.hub);

        setInterval(() => {
          this.hubControl.update();
        }, 100);
      });
    } else {
      throw new Error('There is no characteristic available on this service.');
    }
  }
  // Methods from Hub
  /**
   * Stop engines A and B
   * @method MoveHub#stop
   * @returns {Promise}
   */
  public async stop(): Promise<any> {
    if (!this.preCheck()) {
      return;
    } else {
      this.controlData.speed = 0;
      this.controlData.turnAngle = 0;
      // control datas values might have always been 0, execute force stop
      return await this.hub.motorTimeMultiAsync(1, 0, 0);
    }
  }
  /**
   * Update Boost motor and control configuration
   * @method MoveHub#updateConfiguration
   * @param {IDeviceConfiguration} configuration MoveHub motor and control configuration
   */
  updateConfiguration(configuration: IDeviceConfiguration): void {
    if (!this.hub) {
      return;
    }
    this.hub.updateConfiguration(configuration);
    this.hubControl.updateConfiguration(configuration);
  }

  /**
   * Control the LED on the Move Hub
   * @method MoveHub#led
   * @param {boolean|number|string} color
   * If set to boolean `false` the LED is switched off, if set to `true` the LED will be white.
   * Possible string values: `off`, `pink`, `purple`, `blue`, `lightblue`, `cyan`, `green`, `yellow`, `orange`, `red`,
   * `white`
   */
  led(color: boolean | number | string): void {
    if (!this.preCheck()) {
      return;
    }
    this.hub.led(color);
  }

  /**
   * Control the LED on the Move Hub
   * @method MoveHub#ledAsync
   * @param {boolean|number|string} color
   * If set to boolean `false` the LED is switched off, if set to `true` the LED will be white.
   * Possible string values: `off`, `pink`, `purple`, `blue`, `lightblue`, `cyan`, `green`, `yellow`, `orange`, `red`,
   * `white`
   * @returns {Promise}
   */
  async ledAsync(color: boolean | number | string): Promise<any> {
    if (!this.preCheck()) {
      return;
    }
    return await this.hub.ledAsync(color);
  }

  /**
   * Run a motor for specific time
   * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
   * @param {number} seconds
   * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   */
  motorTime(port: string | number, seconds: number, dutyCycle = 100): void {
    if (!this.preCheck()) {
      return;
    }
    this.hub.motorTime(port, seconds, dutyCycle);
  }

  /**
   * Run a motor for specific time
   * @method MoveHub#motorTimeAsync
   * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
   * @param {number} seconds
   * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
   * @returns {Promise}
   */
  async motorTimeAsync(
    port: string | number,
    seconds: number,
    dutyCycle: number = 100,
    wait: boolean = true
  ): Promise<void> {
    if (!this.preCheck()) {
      return;
    }
    await this.hub.motorTimeAsync(port, seconds, dutyCycle, wait);
  }

  /**
   * Run both motors (A and B) for specific time
   * @param {number} seconds
   * @param {number} dutyCycleA motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   * @param {number} dutyCycleB motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   * @param {function} callback
   */
  motorTimeMulti(
    seconds: number,
    dutyCycleA: number = 100,
    dutyCycleB: number = 100
  ): void {
    if (!this.preCheck()) {
      return;
    }
    this.hub.motorTimeMulti(seconds, dutyCycleA, dutyCycleB);
  }

  /**
   * Run both motors (A and B) for specific time
   * @method MoveHub#motorTimeMultiAsync
   * @param {number} seconds
   * @param {number} [dutyCycleA=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   * @param {number} [dutyCycleB=100] motor power percentage from `-100` to `100`. If a negative value is given rotation
   * is counterclockwise.
   * @param {boolean} [wait=false] will promise wait unitll motorTime run time has elapsed
   * @returns {Promise}
   */
  async motorTimeMultiAsync(
    seconds: number,
    dutyCycleA: number = 100,
    dutyCycleB: number = 100,
    wait: boolean = true
  ): Promise<void> {
    if (!this.preCheck()) {
      return;
    }
    await this.hub.motorTimeMultiAsync(seconds, dutyCycleA, dutyCycleB, wait);
  }

  /**
   * Turn a motor by specific angle
   * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
   * @param {number} angle - degrees to turn from `0` to `2147483647`
   * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   */
  motorAngle(
    port: string | number,
    angle: number,
    dutyCycle: number = 100
  ): void {
    if (!this.preCheck()) {
      return;
    }
    this.hub.motorAngle(port, angle, dutyCycle);
  }

  /**
   * Turn a motor by specific angle
   * @method MoveHub#motorAngleAsync
   * @param {string|number} port possible string values: `A`, `B`, `AB`, `C`, `D`.
   * @param {number} angle - degrees to turn from `0` to `2147483647`
   * @param {number} [dutyCycle=100] motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
   * @returns {Promise}
   */
  async motorAngleAsync(
    port: string | number,
    angle: number,
    dutyCycle: number = 100,
    wait: boolean = true
  ): Promise<void> {
    if (!this.preCheck()) {
      return;
    }
    await this.hub.motorAngleAsync(port, angle, dutyCycle, wait);
  }

  /**
   * Turn both motors (A and B) by specific angle
   * @method MoveHub#motorAngleMulti
   * @param {number} angle degrees to turn from `0` to `2147483647`
   * @param {number} dutyCycleA motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   * @param {number} dutyCycleB motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   */
  motorAngleMulti(
    angle: number,
    dutyCycleA: number = 100,
    dutyCycleB: number = 100
  ): void {
    if (!this.preCheck()) {
      return;
    }
    this.hub.motorAngleMulti(angle, dutyCycleA, dutyCycleB);
  }

  /**
   * Turn both motors (A and B) by specific angle
   * @method MoveHub#motorAngleMultiAsync
   * @param {number} angle degrees to turn from `0` to `2147483647`
   * @param {number} [dutyCycleA=100] motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   * @param {number} [dutyCycleB=100] motor power percentage from `-100` to `100`. If a negative value is given
   * rotation is counterclockwise.
   * @param {boolean} [wait=false] will promise wait unitll motorAngle has turned
   * @returns {Promise}
   */
  async motorAngleMultiAsync(
    angle: number,
    dutyCycleA: number = 100,
    dutyCycleB: number = 100,
    wait: boolean = true
  ): Promise<void> {
    if (!this.preCheck()) {
      return;
    }
    await this.hub.motorAngleMultiAsync(angle, dutyCycleA, dutyCycleB, wait);
  }

  /**
   * Drive specified distance
   * @method MoveHub#drive
   * @param {number} distance distance in centimeters (default) or inches. Positive is forward and negative is backward.
   * @param {boolean} [wait=true] will promise wait untill the drive has completed.
   * @returns {Promise}
   */
  async drive(distance: number, wait: boolean = true): Promise<any> {
    if (!this.preCheck()) {
      return;
    }
    return await this.hub.drive(distance, wait);
  }

  /**
   * Turn robot specified degrees
   * @method MoveHub#turn
   * @param {number} degrees degrees to turn. Negative is to the left and positive to the right.
   * @param {boolean} [wait=true] will promise wait untill the turn has completed.
   * @returns {Promise}
   */
  async turn(degrees: number, wait: boolean = true): Promise<void> {
    if (!this.preCheck()) {
      return;
    }
    return await this.hub.turn(degrees, wait);
  }

  /**
   * Drive untill sensor shows object in defined distance
   * @method MoveHub#driveUntil
   * @param {number} [distance=0] distance in centimeters (default) or inches when to stop. Distance sensor is not very sensitive or accurate.
   * By default will stop when sensor notices wall for the first time. Sensor distance values are usualy between 110-50.
   * @param {boolean} [wait=true] will promise wait untill the bot will stop.
   * @returns {Promise}
   */
  async driveUntil(distance: number = 0, wait: boolean = true): Promise<any> {
    if (!this.preCheck()) {
      return;
    }
    return await this.hub.driveUntil(distance, wait);
  }

  /**
   * Turn until there is no object in sensors sight
   * @method MoveHub#turnUntil
   * @param {number} [direction=1] direction to turn to. 1 (or any positive) is to the right and 0 (or any negative) is to the left.
   * @param {boolean} [wait=true] will promise wait untill the bot will stop.
   * @returns {Promise}
   */
  async turnUntil(direction: number = 1, wait: boolean = true): Promise<any> {
    if (!this.preCheck()) {
      return;
    }
    return await this.hub.turnUntil(direction, wait);
  }

  /**
   * Send raw data
   * @param {object} raw raw data
   */
  rawCommand(raw: RawData): void {
    if (!this.preCheck()) {
      return;
    }
    return this.hub.rawCommand(raw);
  }
}
