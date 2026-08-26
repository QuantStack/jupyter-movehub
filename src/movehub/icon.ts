import { LabIcon } from '@jupyterlab/ui-components';
import LegoBrickSvgstr from '../../style/icons/LegoBrick.svg';
import GreenCircleSvgstr from '../../style/icons/green-circle.svg';
import RedCircleSvgstr from '../../style/icons/red-circle.svg';

export const LegoBrickIcon = new LabIcon({
  name: '@jupyterlab/movehub:lego-brick',
  svgstr: LegoBrickSvgstr
});
export const GreenCircle = new LabIcon({
  name: '@jupyterlab/movehub:green-circle',
  svgstr: GreenCircleSvgstr
});

export const RedCircle = new LabIcon({
  name: '@jupyterlab/movehub:red-circle',
  svgstr: RedCircleSvgstr
});
