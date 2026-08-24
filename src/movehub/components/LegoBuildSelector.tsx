import React, { useState } from 'react';
import { HTMLSelect, ReactWidget } from '@jupyterlab/ui-components';
import { MoveHub } from '../moveHub';

const LegoModels = ['Move Hub', 'Vernie', 'Frankie'];
interface IMoveHubPanel {
  device: MoveHub;
}

export function LegoBuildSelector({ device }: IMoveHubPanel) {
  const [selectedValue, setSelectedValue] = useState<string>('-');

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
    device.legoBuild.set(event.target.value);
  };

  return (
    <HTMLSelect
      id="build-selector"
      onChange={handleModelChange}
      value={selectedValue}
    >
      <option value="" selected hidden>
        Pick a build
      </option>
      {LegoModels.map(model => (
        <option key={model} value={model}>
          {model}
        </option>
      ))}
    </HTMLSelect>
  );
}

export class LegoBuildSelectorWidget extends ReactWidget {
  public device: MoveHub;

  constructor(device: MoveHub) {
    super();
    this.device = device;
  }
  render() {
    return <LegoBuildSelector device={this.device} />;
  }
}
