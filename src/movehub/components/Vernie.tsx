import React from 'react';
import VernieLightSVG from '../../../style/images/VernieSchematicLight.svg';
import VernieDarkSVG from '../../../style/images/VernieSchematicDark.svg';
const VernieLightSVGUrl = `data:image/svg+xml;base64,${btoa(VernieLightSVG)}`;
const VernieDarkSVGUrl = `data:image/svg+xml;base64,${btoa(VernieDarkSVG)}`;
import { IBuildProps } from './MoveHubPanel';
import { UseSignal } from '@jupyterlab/apputils';

export default function Vernie({ themeManager }: IBuildProps) {
  const theme = themeManager.theme;
  if (theme) {
    const isThemeLight = themeManager.isLight(theme!);
    const currentSVGUrl = isThemeLight ? VernieLightSVGUrl : VernieDarkSVGUrl;
    return (
      <UseSignal signal={themeManager.themeChanged}>
        {(): JSX.Element => (
          <img
            src={currentSVGUrl}
            alt="Vernie build represented with LeoCAD"
            height="280px"
          />
        )}
      </UseSignal>
    );
  } else {
    return (
      <img
        src={VernieLightSVGUrl}
        alt="Vernie build represented with LeoCAD"
        height="280px"
      />
    );
  }
}
