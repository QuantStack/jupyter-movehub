import React from 'react';
import { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo, MoveHub } from '../moveHub';
import ColoredCircleWithText from './ColoredCircleWithText';

export function DeviceInfoTableComplete({ moveHub }: { moveHub: MoveHub }) {
  const [deviceState, setDeviceState] = useState<DeviceInfo>(defaultDeviceInfo);

  useEffect(() => {
    const poll = new Poll({
      auto: true,
      name: 'device-status-polling',
      factory: async () => {
        setDeviceState({ ...moveHub.deviceInfo });
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
  }, [moveHub.deviceInfo]);
  return (
    <>
      <table className="custom-table">
        <thead className="custom-table-thead">
          <tr className="custom-table-tr">
            <th className="custom-table-th"></th>
            <th className="custom-table-th">Status</th>
            <th className="custom-table-th">MAC address</th>
            <th className="custom-table-th">Identifier</th>
            <th className="custom-table-th">Led color</th>
            <th className="custom-table-th">Battery</th>
          </tr>
        </thead>
        <tbody>
          <tr className="custom-table-tr">
            <td className="custom-table-td" style={{ fontWeight: '600' }}>
              {'Status'}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                <ColoredCircleWithText color={'green'} text={'connected'} />
              ) : (
                <ColoredCircleWithText color={'red'} text={'disconnected'} />
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                <div>{deviceState.primaryMACAddress}</div>
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                <div>{deviceState.identifier}</div>
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected && deviceState.ledColor ? (
                <ColoredCircleWithText
                  color={deviceState.ledColor}
                  text={deviceState.ledColor}
                />
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected && deviceState.batteryLevel ? (
                <div>{deviceState.batteryLevel + '%'}</div>
              ) : (
                <div></div>
              )}{' '}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="custom-table">
        <thead className="custom-table-thead">
          <tr className="custom-table-tr">
            <th className="custom-table-th"> </th>
            <th className="custom-table-th">Roll</th>
            <th className="custom-table-th">Pitch</th>
            <th className="custom-table-th">Yaw</th>
            <th className="custom-table-th">Distance</th>
            <th className="custom-table-th">Color</th>
          </tr>
        </thead>
        <tbody>
          <tr className="custom-table-tr">
            <td className="custom-table-td" style={{ fontWeight: '600' }}>
              {'Sensors'}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.tilt.roll} °`
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.tilt.pitch} °`
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.tilt.yaw} °`
              ) : (
                <div></div>
              )}{' '}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                deviceState.distance === Infinity ? (
                  'Infinity'
                ) : (
                  `${deviceState.distance} mm`
                )
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                <div>{deviceState.color}</div>
              ) : (
                <div></div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="custom-table">
        <thead className="custom-table-thead">
          <tr className="custom-table-tr">
            <th className="custom-table-th"> </th>
            <th className="custom-table-th">Port A</th>
            <th className="custom-table-th">Port B</th>
            <th className="custom-table-th">Port AB</th>
            <th className="custom-table-th">Port C</th>
            <th className="custom-table-th">Port D</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="custom-table-td" style={{ fontWeight: '600' }}>
              {' '}
              Angle{' '}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.A.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.B.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.AB.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.C.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.D.value} ° `
              ) : (
                <div></div>
              )}
            </td>
          </tr>
          <tr className="custom-table-tr">
            <td className="custom-table-td" style={{ fontWeight: '600' }}>
              {' '}
              Action{' '}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.A.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.B.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.AB.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.C.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="custom-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.D.action}`
              ) : (
                <div></div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
