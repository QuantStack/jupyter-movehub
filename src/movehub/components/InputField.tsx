import React from 'react';
import { useState } from 'react';

interface IInputFieldProps {
  type: string;
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export default function InputField(props: IInputFieldProps) {
  const [inputValue, setInputValue] = useState<string>(props.value);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    if (props.onChange) {
      props.onChange(newValue);
    }
  };

  return (
    <div>
      <input
        className="move-input-field"
        type={props.type}
        value={inputValue}
        placeholder={props.placeholder}
        onChange={handleInputChange}
      />
    </div>
  );
}
