import React from 'react';
import FrankieLightSVG from '../style/images/FrankieSchematicLight.svg';
import FrankieDarkSVG from '../style/images/FrankieSchematicDark.svg';
const FrankieLightSVGUrl = `data:image/svg+xml;base64,${btoa(FrankieLightSVG)}`;
const FrankieDarkSVGUrl = `data:image/svg+xml;base64,${btoa(FrankieDarkSVG)}`;
import { IBuildProps } from './MoveHubPanel';
import { UseSignal } from '@jupyterlab/apputils';

export default function Frankie({ themeManager }: IBuildProps) {
  const theme = themeManager.theme;
  if (theme) {
    const isThemeLight = themeManager.isLight(theme!);
    const currentSVGUrl = isThemeLight ? FrankieLightSVGUrl : FrankieDarkSVGUrl;
    return (
      <UseSignal signal={themeManager.themeChanged}>
        {(): JSX.Element => (
          <img
            src={currentSVGUrl}
            alt="Frankie build represented with LeoCAD"
            height="220px"
          />
        )}
      </UseSignal>
    );
  } else {
    return (
      <img
        src={FrankieLightSVGUrl}
        alt="Frankie build represented with LeoCAD"
        height="220px"
      />
    );
  }
}
