import React from 'react';
import { useState } from 'react';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import { MoveHubComponent } from './MoveHubComponent';
import { VernieComponent } from './VernieComponent';
import { FrankieComponent } from './FrankieComponent';

export function LegoBuildSpecific({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  const [legoBuild, setLegoBuild] = useState<any>('Move Hub');

  const renderSelectedComponent = () => {
    switch (legoBuild) {
      case 'Move Hub':
        return <MoveHubComponent device={device} themeManager={themeManager} />;
      case 'Vernie':
        return <VernieComponent device={device} themeManager={themeManager} />;
      case 'Frankie':
        return <FrankieComponent device={device} themeManager={themeManager} />;
      default:
        return <div>Pick a build from the toolbar dropdown.</div>;
    }
  };

  device.legoBuild.changed.connect(() => {
    const newLegoBuild = device.legoBuild.get();
    setLegoBuild(newLegoBuild);
  });

  return (
    <div>
      <div>{renderSelectedComponent()}</div>
    </div>
  );
}
