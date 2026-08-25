import React from 'react';
import MoveHubLightSVG from '../../../style/images/MoveHubLight.svg';
import MoveHubDarkSVG from '../../../style/images/MoveHubDark.svg';
const MoveHubLightSVGUrl = `data:image/svg+xml;base64,${btoa(MoveHubLightSVG)}`;
const MoveHubDarkSVGUrl = `data:image/svg+xml;base64,${btoa(MoveHubDarkSVG)}`;
import { IBuildProps } from './MoveHubPanel';
import { UseSignal } from '@jupyterlab/apputils';

export default function MoveHub({ themeManager }: IBuildProps) {
  const theme = themeManager.theme;
  if (theme) {
    const isThemeLight = themeManager.isLight(theme!);
    const currentSVGUrl = isThemeLight ? MoveHubLightSVGUrl : MoveHubDarkSVGUrl;
    return (
      <UseSignal signal={themeManager.themeChanged}>
        {(): JSX.Element => (
          <img
            src={currentSVGUrl}
            alt="Move Hub represented with LeoCAD"
            height="180px"
          />
        )}
      </UseSignal>
    );
  } else {
    return (
      <img
        src={MoveHubLightSVGUrl}
        alt="Move Hub represented with LeoCAD"
        height="220px"
      />
    );
  }
}
