import { LabIcon } from '@jupyterlab/ui-components';
import BrickSvgstr from '../../style/icons/brick.svg';
import GreenCircleSvgstr from '../../style/icons/green-circle.svg';
import RedCircleSvgstr from '../../style/icons/red-circle.svg';

export const BrickIcon = new LabIcon({
  name: '@jupyterlab/movehub:brick',
  svgstr: BrickSvgstr
});
export const GreenCircle = new LabIcon({
  name: '@jupyterlab/movehub:green-circle',
  svgstr: GreenCircleSvgstr
});

export const RedCircle = new LabIcon({
  name: '@jupyterlab/movehub:red-circle',
  svgstr: RedCircleSvgstr
});
