import { test, expect } from '@playwright/test';
import { mockEveryVoiceAPI } from './fixtures/data-fixture';
import fs from 'fs';
test.describe('test creator interface', () => {
  test.beforeEach('Setup', async ({ page }) => {
    mockEveryVoiceAPI(page);
    await page.goto('/create');
  });
  test('check UI', async ({ page }) => {
    await expect(
      page.getByTestId('config-file-importer'),
      'should have config loader '
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Create' }),
      'should have creator link'
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Play' }),
      'should have creator link'
    ).toBeVisible();
  });
  test('check create configuration', async ({ page }) => {
    await page.locator('#step-config-tab').click({ force: true });
    await page.locator('#input-config-tab').click({ force: true });
    await expect(
      page.locator('#save_config'),
      'save configuration should be disabled'
    ).toHaveAttribute('disabled');
    await page.getByLabel('Title of activity').fill('transcribe test');

    await page.getByLabel('API').fill('https://mock-api.dev/');
    await page
      .getByLabel('Instruction for this activity')
      .fill('transcribe what you hear');
    await expect(
      page.getByText(/API endpoint is reachable/),
      'alert api status'
    ).toBeVisible();
    await expect(
      page.locator('#save_config'),
      'save configuration should be enabled'
    ).not.toHaveAttribute('disabled');
    const download = page.waitForEvent('download');
    await page.locator('#save_config').click();
    const configFile = JSON.parse(
      fs.readFileSync(await (await download).path(), {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    await expect(
      configFile.title,
      'Downloaded configuration file title is correct'
    ).toMatch('transcribe test');
    await expect(
      configFile.text_instructions,
      'Downloaded configuration file instruction is correct'
    ).toMatch('transcribe what you hear');
    await expect(
      configFile.api,
      'Downloaded configuration file api is correct'
    ).toMatch('https://mock-api.dev/');
  });
  test('check load configuration', async ({ page }) => {
    const config = JSON.parse(
      fs.readFileSync('e2e/fixtures/test-config.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );

    await page.locator('#step-config-tab').click({ force: true });
    await page.locator('#input-config-tab').click({ force: true });
    await expect(
      page.locator('#save_config'),
      'save configuration should be disabled'
    ).toHaveAttribute('disabled');
    await expect(
      page.getByLabel('Title of activity'),
      'title should be empty'
    ).toBeEmpty();
    await page.locator('#load-config-tab').click({ force: true });
    await page
      .getByTestId('config-file-importer')
      .setInputFiles('e2e/fixtures/test-config.json');
    await expect(
      page.getByText(/Activity parameters have been loaded/),
      'alert config loaded'
    ).toBeVisible();
    await expect(
      page.getByText(/API endpoint is reachable/),
      'alert api status'
    ).toBeVisible();
    //go back config tab to verify data
    await page.locator('#step-config-tab').click({ force: true });
    await page.locator('#input-config-tab').click({ force: true });
    await expect(
      page.locator('#save_config'),
      'save configuration should be enabled'
    ).not.toHaveAttribute('disabled');
    await expect(
      page.getByLabel('Title of activity'),
      'title should have correct value'
    ).toHaveValue(config.title);
    await expect(
      page.getByLabel('API', { exact: true }),
      'api should have correct value'
    ).toHaveValue(config.api);
  });
  test('check create data', async ({ page }) => {
    await page.locator('#step-data-tab').click({ force: true });
    await page.locator('#input-data-tab').click({ force: true });

    const textBox = page.getByLabel('Data for this activity');
    const addDataBtn = page.getByTestId('add_data');
    const exportDataBtn = page.getByTestId('export_data');
    const dataList = page.getByTestId('data_list');
    await expect(textBox, 'text box should be visible').toBeVisible();
    await expect(
      addDataBtn,
      'add data button should be disabled'
    ).toHaveAttribute('disabled');
    await expect(
      exportDataBtn,
      'export data button should be disabled'
    ).toHaveAttribute('disabled');
    await expect(
      dataList.locator('span'),
      'data list should be empty'
    ).toHaveCount(0);

    await textBox.fill('X̱EX̱E ÁLḴ ȻEȻENSIEW̱');
    await textBox.blur();
    await expect(
      addDataBtn,
      'add data button should be enabled'
    ).not.toHaveAttribute('disabled');
    await expect(
      exportDataBtn,
      'export data button should be disabled'
    ).toHaveAttribute('disabled');
    await addDataBtn.click({ force: true });
    await expect(
      dataList.locator('span'),
      'data list should have data'
    ).toHaveCount(1);

    await expect(
      exportDataBtn,
      'export data button should be enabled'
    ).not.toHaveAttribute('disabled');
    const download = page.waitForEvent('download');
    await exportDataBtn.click();
    const dataFile = JSON.parse(
      fs.readFileSync(await (await download).path(), {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    expect(dataFile[0].orthography, 'verify data file').toMatch(
      'X̱EX̱E ÁLḴ ȻEȻENSIEW̱'
    );
  });
  test('check load data', async ({ page }) => {
    const data = JSON.parse(
      fs.readFileSync('e2e/fixtures/test-data.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    await page.locator('#step-data-tab').click({ force: true });
    await page.locator('#input-data-tab').click({ force: true });
    const dataList = page.getByTestId('data_list');
    await expect(
      dataList.locator('span'),
      'data list should be empty'
    ).toHaveCount(0);
    await page.locator('#load-data-tab').click({ force: true });
    await page
      .getByTestId('data-file-importer')
      .setInputFiles('e2e/fixtures/test-data.json');
    await expect(
      page.getByText(/Activity data have been loaded/),
      'alert data loaded'
    ).toBeVisible();
    await expect(
      dataList.locator('span'),
      'data list should have data'
    ).toHaveCount(data.length);
    let r = 0;
    for (const row of await dataList.locator('span').all()) {
      expect(row, `should contain text ${data[r].orthography}`).toContainText(
        data[r].orthography
      );
      r++;
    }
  });
  test('check preview and export', async ({ page }) => {
    const data = JSON.parse(
      fs.readFileSync('e2e/fixtures/test-activity.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    const exportActivityButton = page.locator('#step-export-activity-button');
    expect(
      exportActivityButton,
      'export button should be disabled'
    ).toHaveAttribute('disabled');
    await page.locator('#load-config-tab').click({ force: true });
    await page
      .getByTestId('config-file-importer')
      .setInputFiles('e2e/fixtures/test-config.json');
    await expect(
      page.getByText(/Activity parameters have been loaded/),
      'alert config loaded'
    ).toBeVisible();
    expect(
      exportActivityButton,
      'export button should be disabled'
    ).toHaveAttribute('disabled');
    await page
      .getByTestId('data-file-importer')
      .setInputFiles('e2e/fixtures/test-data.json');
    await expect(
      page.getByText(/Activity data have been loaded/),
      'alert config loaded'
    ).toBeVisible();
    expect(
      exportActivityButton,
      'export button should be enabled'
    ).not.toHaveAttribute('disabled');
    await expect(
      page.getByTestId('start_activity'),
      'should have start button'
    ).toBeVisible();
    await page.getByTestId('start_activity').click({ force: true });
    //Give the correct answer and check the results
    await expect(
      page.getByText('Audio generated'),
      'should display notice about audio'
    ).toBeVisible();
    await expect(
      exportActivityButton,
      'export data button should be enabled'
    ).not.toHaveAttribute('disabled');
    const download = page.waitForEvent('download');
    await exportActivityButton.click();
    const activityFile = JSON.parse(
      fs.readFileSync(await (await download).path(), {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    await expect(
      activityFile.configuration.title,
      'title should have correct value'
    ).toMatch(data.configuration.title);
    await expect(
      activityFile.configuration.api,
      'api should have correct value'
    ).toMatch(data.configuration.api);
    expect(activityFile.data, 'data should have correct value').toMatch(
      data.data
    );
  });
  test('check file import handling', async ({ page }) => {
    await page
      .getByTestId('config-file-importer')
      .setInputFiles('e2e/fixtures/test-activity.json');
    await expect(
      page.getByText(/Activity parameters could not be loaded/).last(),
      'alert config loaded'
    ).toBeVisible();
    await page
      .getByTestId('config-file-importer')
      .setInputFiles('e2e/fixtures/test-config.json');
    await expect(
      page.getByText(/Activity parameters have been loaded/).last(),
      'alert config loaded'
    ).toBeVisible();
    await page
      .getByTestId('data-file-importer')
      .setInputFiles('e2e/fixtures/test-activity.json');
    await expect(
      page.getByText(/Activity data could not be loaded/).last(),
      'alert data loaded'
    ).toBeVisible();
    await page
      .getByTestId('data-file-importer')
      .setInputFiles('e2e/fixtures/test-data.json');
    await expect(
      page.getByText(/Activity data have been loaded/).last(),
      'alert data loaded'
    ).toBeVisible();
  });
});
