import React from 'react';
import { useEffect, useState } from 'react';
import { Poll } from '@lumino/polling';
import { DeviceInfo } from '../movehub-control/types';
import { defaultDeviceInfo, MoveHub } from '../moveHub';
import ColoredCircleWithText from './ColoredCircleWithText';

export function DeviceInfoTable({ moveHub }: { moveHub: MoveHub }) {
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
  console.log(deviceState.ledColor);
  return (
    <>
      <table className="device-info-table">
        <thead className="device-info-table-thead">
          <tr className="device-info-table-tr">
            <th className="device-info-table-th"></th>
            <th className="device-info-table-th">Status</th>
            <th className="device-info-table-th">MAC address</th>
            <th className="device-info-table-th">Identifier</th>
            <th className="device-info-table-th">Battery</th>
          </tr>
        </thead>
        <tbody>
          <tr className="device-info-table-tr">
            <td className="device-info-table-td" style={{ fontWeight: '600' }}>
              {'Status'}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                <ColoredCircleWithText color={'green'} text={'connected'} />
              ) : (
                <ColoredCircleWithText color={'red'} text={'disconnected'} />
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                <div>{deviceState.primaryMACAddress}</div>
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                <div>{deviceState.identifier}</div>
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected && deviceState.batteryLevel ? (
                <div>{deviceState.batteryLevel + '%'}</div>
              ) : (
                <div></div>
              )}{' '}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="device-info-table">
        <thead className="device-info-table-thead">
          <tr className="device-info-table-tr">
            <th className="device-info-table-th"> </th>
            <th className="device-info-table-th">Roll</th>
            <th className="device-info-table-th">Pitch</th>
            <th className="device-info-table-th">Yaw</th>
            <th className="device-info-table-th">Distance</th>
            <th className="device-info-table-th">Color</th>
          </tr>
        </thead>
        <tbody>
          <tr className="device-info-table-tr">
            <td className="device-info-table-td" style={{ fontWeight: '600' }}>
              {'Sensors'}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.tilt.roll} °`
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.tilt.pitch} °`
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.tilt.yaw} °`
              ) : (
                <div></div>
              )}{' '}
            </td>
            <td className="device-info-table-td">
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
            <td className="device-info-table-td">
              {deviceState.connected ? (
                <div>{deviceState.color}</div>
              ) : (
                <div></div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="device-info-table">
        <thead className="device-info-table-thead">
          <tr className="device-info-table-tr">
            <th className="device-info-table-th"> </th>
            <th className="device-info-table-th">Port A</th>
            <th className="device-info-table-th">Port B</th>
            <th className="device-info-table-th">Port AB</th>
            <th className="device-info-table-th">Port C</th>
            <th className="device-info-table-th">Port D</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="device-info-table-td" style={{ fontWeight: '600' }}>
              {' '}
              Angle{' '}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.A.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.B.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.AB.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.C.value} ° `
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.D.value} ° `
              ) : (
                <div></div>
              )}
            </td>
          </tr>
          <tr className="device-info-table-tr">
            <td className="device-info-table-td" style={{ fontWeight: '600' }}>
              {' '}
              Action{' '}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.A.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.B.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.AB.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
              {deviceState.connected ? (
                `${deviceState.ports.C.action}`
              ) : (
                <div></div>
              )}
            </td>
            <td className="device-info-table-td">
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
