import React from 'react';
import { useState } from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import { MoveHub } from '../moveHub';
import { HubAsync } from '../movehub-control/hub/hubAsync';
import { IThemeManager } from '@jupyterlab/apputils';
import Sensors from './Sensors';
import MotorControl from './MotorControl';
import { MoveHubLed } from './MoveHubLed';
import DualMotorControl from './DualMotorControl';
import { Telecommand } from './Telecommand';
import { VernieLed } from './VernieLed';
import { MotorPort } from './MotorControl';

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

type Build = 'Move Hub' | 'Vernie';

interface IBuildConfig {
  Component: React.FC<IMoveHubPanelWithThemeProps>;
  dual: {
    label1: string;
    label2: string;
    validation1: string;
    validation2: string;
  };
  telecommand: boolean;
  ports: MotorPort[];
}

const BUILDS: Record<Build, IBuildConfig> = {
  'Move Hub': {
    Component: MoveHubLed,
    dual: {
      label1: 'Turn both motors together',
      label2: 'Turn the motors against each other',
      validation1: 'Run',
      validation2: 'Run'
    },
    telecommand: false,
    ports: ['A', 'B', 'C', 'D']
  },
  Vernie: {
    Component: VernieLed,
    dual: {
      label1: 'Drive forward or backward',
      label2: 'Turn',
      validation1: 'Translate',
      validation2: 'Rotate'
    },
    telecommand: true,
    ports: ['A', 'B', 'D']
  }
};

export function Dashboard({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  const [Build, setBuild] = useState<any>('Move Hub');

  device.Build.changed.connect(() => {
    const newBuild = device.Build.get();
    setBuild(newBuild);
  });

  const config = BUILDS[Build as Build] ?? BUILDS['Move Hub'];
  const { Component, dual, telecommand, ports } = config;
  const props = { device, themeManager };

  return (
    <div className="dashboard">
      <div className="dashboard-row">
        <Sensors {...props} />
        <Component {...props} />
        <DualMotorControl {...props} {...dual} />
        {telecommand && <Telecommand {...props} />}
        {ports.map(port => (
          <MotorControl key={port} {...props} port={port} />
        ))}
      </div>
    </div>
  );
}

export function MoveHubPanel({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  const props = { device, themeManager };

  return <Dashboard {...props} />;
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
