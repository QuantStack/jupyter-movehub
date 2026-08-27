import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import MoveHubExtensionPlugins from './movehub-extension';
/**
 * Initialization data for the jupyter-movehub extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-movehub:plugin',
  description:
    'A JupyterLab extension to connect to a Lego Move Hub and drive Legoboost robots.',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension jupyter-movehub is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyter-movehub settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyter-movehub.', reason);
        });
    }
  }
};

export default [plugin, ...MoveHubExtensionPlugins];
