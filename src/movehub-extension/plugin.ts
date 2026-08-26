/* Distributed under the terms of the Modified BSD License.

# This file comes from https://github.com/jupyter-robotics/ipylgbst and has been adapted for the current extension
#
# It is licensed under the following license:
#
# BSD License

Copyright (c) Dr Thorsten Beier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
*/
import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import * as widgetExports from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { IBluetoothManager } from '@jupyter-bluetooth-manager/bluetooth';

const EXTENSION_ID = 'ipymovehub:plugin';

/**
 * The ipymovehub plugin.
 */
export const ipymovehubPlugin: IPlugin<Application<Widget>, void> = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry, IBluetoothManager],
  activate: activateWidgetExtension,
  autoStart: true
} as unknown as IPlugin<Application<Widget>, void>;
// the "as unknown as ..." typecast above is solely to support JupyterLab 1
// and 2 in the same codebase and should be removed when we migrate to Lumino.

export default ipymovehubPlugin;

/**
 * Activate the widget extension.
 */
async function activateWidgetExtension(
  app: Application<Widget>,
  registry: IJupyterWidgetRegistry,
  bluetoothManager: IBluetoothManager
): Promise<void> {
  widgetExports.MoveHubModel.bluetoothManager = bluetoothManager;
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: widgetExports
  });
}
