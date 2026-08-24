import React from 'react';
import { useState } from 'react';
import { HubAsync } from '../moveHub/hub/hubAsync';
import InputField from './InputField';

export interface IMoveFormProps {
  hub: HubAsync;
  label: string;
  actionButton1: string;
  actionButton2: string;
  buttonText1: string;
  buttonText2: string;
  type: string;
  unit?: string;
  port: string;
  caution?: string;
  dutyCycleDirect: number;
  dutyCycleIndirect: number /*dutyCycle: motor power percentage from `-100` to `100`. If a negative value is given rotation is counterclockwise or direct*/;
}

export function MoveForm(props: IMoveFormProps) {
  const [inputValue, setInputValue] = useState('0');
  const hub = props.hub;

  const selectMove = (action: string) => {
    return () => {
      switch (action) {
        case 'RotateIndirect':
          hub.motorAngle(
            props.port,
            Number(inputValue),
            props.dutyCycleIndirect,
            () => false
          );
          break;
        case 'RotateDirect':
          hub.motorAngle(
            props.port,
            Number(inputValue),
            props.dutyCycleDirect,
            () => false
          );
          break;
        case 'Drive':
          hub.drive(Number(inputValue));
          break;
        case 'Turn':
          hub.turn(Number(inputValue));
          break;
        case 'WakeUp':
          console.log('Wake up');
          break;
        case 'SitDown':
          console.log('Sit down');
          break;
        default:
          console.error('This action is unknown');
          break;
      }
    };
  };

  return (
    <div>
      <div className="move-form-main-container">
        <div className="move-input-field-text">
          <p style={{ margin: '8px 0' }}>
            {props.label} {props.unit}
          </p>
        </div>
        <div className="move-input-field-with-2buttons">
          <InputField
            type={props.type}
            value={inputValue}
            onChange={setInputValue}
          />
          <button
            className="move-validation-button"
            onClick={selectMove(props.actionButton1)}
          >
            {props.buttonText1}
          </button>
          <button
            className="move-validation-button"
            onClick={selectMove(props.actionButton2)}
          >
            {props.buttonText2}
          </button>
        </div>
      </div>
      <div style={{ marginBottom: '10px', fontSize: '10px' }}>
        {props.caution}
      </div>
    </div>
  );
}
