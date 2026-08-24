import React from 'react';
import { IMoveHubPanelWithThemeProps } from './MoveHubPanel';
import { MoveForm } from './MoveForm';
import { ColorSelector } from './ColorSelector';
import Frankie from './Frankie';

export function FrankieComponent({
  device,
  themeManager
}: IMoveHubPanelWithThemeProps) {
  return (
    <>
      <div className="lego-build-control-grid-container">
        <div className="lego-build-control-grid-item-left">
          <Frankie themeManager={themeManager} />
        </div>
        <div className="lego-build-control-grid-item-right">
          <h4
            style={{
              color: 'var(--jp-accept-color-normal)',
              margin: '0',
              padding: '0'
            }}
          >
            Integrated motors
          </h4>
          <MoveForm
            hub={device.hub}
            label={"Change Frankie's position"}
            actionButton1={'WakeUp'}
            actionButton2={'SitDown'}
            buttonText1={'Wake up'}
            buttonText2={'Sit down'}
            type={'angle'}
            port={'AB'}
            caution=""
            dutyCycleDirect={-100}
            dutyCycleIndirect={100}
          />

          <h4
            style={{
              color: 'var(--jp-accept-color-normal)',
              margin: '0',
              padding: '0'
            }}
          >
            Other motor(s)
          </h4>
          <p style={{ margin: '8px 0', fontWeight: '600' }}>
            Motor 1 on port D
          </p>
          <MoveForm
            hub={device.hub}
            label={"Move Frankie's tail"}
            actionButton1={'RotateIndirect'}
            actionButton2={'RotateDirect'}
            buttonText1={'Left'}
            buttonText2={'Right'}
            type={'angle'}
            port={'D'}
            caution=""
            dutyCycleDirect={-100}
            dutyCycleIndirect={100}
          />
          <p style={{ margin: '8px 0', fontWeight: '600' }}>
            Motor 2 on port C
          </p>
          <MoveForm
            hub={device.hub}
            label={'Turn external motor'}
            actionButton1="RotateIndirect"
            actionButton2="RotateDirect"
            buttonText1={'Indirect'}
            buttonText2={'Direct'}
            type={'angle'}
            port={'C'}
            caution=""
            dutyCycleDirect={-100}
            dutyCycleIndirect={100}
          />
          <ColorSelector device={device} />
        </div>
      </div>
    </>
  );
}
