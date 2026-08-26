import { expect, test } from '@jupyterlab/galata';
import { ConsoleMessage, Page } from '@playwright/test';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should emit an activation console message', async ({
  page
}: {
  page: Page;
}) => {
  const logs: string[] = [];

  page.on('console', (message: ConsoleMessage) => {
    logs.push(message.text());
  });

  await page.goto('./lab');

  expect(
    logs.filter(s => s === 'JupyterLab extension jupyter-movehub is activated!')
  ).toHaveLength(1);
});
