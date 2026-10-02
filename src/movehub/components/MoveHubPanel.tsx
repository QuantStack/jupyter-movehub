import React from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import { MoveHub } from '../moveHub';
import { HubAsync } from '../movehub-control/hub/hubAsync';
import { DeviceInfoTable } from './DeviceInfoTable';
import { LegoBuildSpecific } from './LegoBuildSpecific';
import { IThemeManager } from '@jupyterlab/apputils';

export interface IMoveHubPanelProps {
  device: MoveHub;
}

export interface IMoveHubPanelWithThemeProps {
  device: MoveHub;
  themeManager: IThemeManager;
}

export interface IHubControlProps {
  hub: HubAsync;
}

export interface IBuildProps {
  themeManager: IThemeManager;
}

export function MoveHubInfos(props: { device: MoveHub }) {
  return <DeviceInfoTable moveHub={props.device} />;
}

export function MoveHubPanel({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  return (
    <div>
      <LegoBuildSpecific device={device} themeManager={themeManager} />
      <MoveHubInfos device={device} />
    </div>
  );
}

export class MoveHubPanelWidget extends ReactWidget {
  public device: MoveHub;
  public themeManager: IThemeManager;

  constructor(device: MoveHub, themeManager: IThemeManager) {
    super();
    this.device = device;
    this.themeManager = themeManager;
  }

  render() {
    return (
      <MoveHubPanel device={this.device} themeManager={this.themeManager} />
    );
  }
}
