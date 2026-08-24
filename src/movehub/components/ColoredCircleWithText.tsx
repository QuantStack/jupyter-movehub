import React from "react";

export interface IColoredCircleWithTextProps {
  color: string;
  text: string;
}

export default function ColoredCircleWithText(
  props: IColoredCircleWithTextProps
) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        className="colored-circle"
        style={{ backgroundColor: props.color }}
      ></div>
      <span>{props.text}</span>
    </div>
  );
}
