import React from 'react';
import R2D2LightSVG from '../../../style/images/R2D2Light.svg';
import R2D2DarkSVG from '../../../style/images/R2D2Dark.svg';
const R2D2LightSVGUrl = `data:image/svg+xml;base64,${btoa(R2D2LightSVG)}`;
const R2D2DarkSVGUrl = `data:image/svg+xml;base64,${btoa(R2D2DarkSVG)}`;
import { IBuildProps } from './MoveHubPanel';
import { UseSignal } from '@jupyterlab/apputils';

export default function R2D2({ themeManager }: IBuildProps) {
  const theme = themeManager.theme;
  if (theme) {
    const isThemeLight = themeManager.isLight(theme!);
    const currentSVGUrl = isThemeLight ? R2D2LightSVGUrl : R2D2DarkSVGUrl;
    return (
      <UseSignal signal={themeManager.themeChanged}>
        {(): JSX.Element => (
          <img
            src={currentSVGUrl}
            alt="R2D2 build represented with LeoCAD"
            height="280px"
          />
        )}
      </UseSignal>
    );
  } else {
    return (
      <img
        src={R2D2LightSVGUrl}
        alt="R2D2 build represented with LeoCAD"
        height="280px"
      />
    );
  }
}
