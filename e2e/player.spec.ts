import { test, expect } from '@playwright/test';
import { mockEveryVoiceAPI } from './fixtures/data-fixture';

test.describe('test player interface', () => {
  test.beforeEach('Setup', async ({ page }) => {
    mockEveryVoiceAPI(page);
    await page.goto('/');
  });
  test('check UI', async ({ page }) => {
    await expect(
      page.getByTestId('activity_loader_input'),
      'should have activity loader '
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
  test('play activity', async ({ page }) => {
    await page.getByTestId('activity_loader_input').click();
    await page
      .getByTestId('activity_loader_input')
      .setInputFiles('e2e/fixtures/test-activity.json');
    await expect(
      page.getByText('API:online'),
      'should detect API status'
    ).toBeVisible();
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
      page.getByText('transcribe test'),
      'should have title'
    ).toBeVisible();
    await expect(
      page.getByText('Write what you hear'),
      'should have instructions'
    ).toBeVisible();
    await expect(
      page.getByTitle('Play'),
      'should have play button'
    ).toBeVisible();
    await expect(
      page.getByTitle('Pause'),
      'should have play button'
    ).toBeVisible();
    await expect(
      page.getByTitle('Stop'),
      'should have play button'
    ).toBeVisible();
    await expect(
      page.getByTestId('special_chars'),
      'should display special characters'
    ).toBeVisible();
    await expect(
      page.getByTestId('special_chars').getByRole('button'),
      'should have 12 special characters'
    ).toHaveCount(16);

    await page.getByTitle('Play').click();
    await expect
      .soft(
        page.getByTitle('validate'),
        'validation button should not be enabled'
      )
      .toHaveAttribute('disabled');
    await page.getByLabel('Transcript').fill('X̱EX̱E ÁLḴ ȻEȻENSIEW̱');
    await page.getByTitle('Play').click();
    await expect
      .soft(page.getByTitle('validate'), 'validation button should be enabled')
      .toBeEnabled();
    await expect(
      page.getByText('Next'),
      'next button should not be visible'
    ).not.toBeVisible();
    await page.getByTitle('validate').click({ force: true });
    await expect(
      page.getByText('Next'),
      'next button should be visible'
    ).toBeVisible();
    for (const letter of await page.locator('span.letter.feedback').all())
      await expect(letter, 'input is correct').toHaveClass(
        /btn-outline-success/
      );

    await expect(
      page.getByText('Completed'),
      'Completed list should be visible'
    ).toBeVisible();
    const completedList = await page.getByTestId('completed_list');
    await expect(
      completedList.locator('li').first().locator('span.status'),
      'expect first completed item to give positive feedback'
    ).toHaveClass(/success/);
    //test ASCII input
    await page.getByTestId('next_item').click();
    await expect(
      page.getByText('Audio generated').first(),
      'should display notice about audio'
    ).toBeVisible();
    //PEL SEK ÁNE TEṈ SE SÁ ĆEṈ
    await page.getByLabel('Transcript').fill('PEL SEK ANE TEṈ SE SA CEN');
    await page.getByTitle('Play').click();
    await page.getByTitle('validate').click({ force: true });
    for (const letter of await page.locator('span.letter.feedback').all())
      await expect(letter, 'input is correct').toHaveClass(
        /btn-outline-(success|warning)/
      );
    await expect(
      completedList.locator('li').nth(1).locator('span.status'),
      'expect first completed item to give positive feedback'
    ).toHaveClass(/success/);
    //test incorrect input
    await page.getByTestId('next_item').click();
    await expect(
      page.getByText('Audio generated').first(),
      'should display notice about audio'
    ).toBeVisible();
    //S₭ELE₭E ĆOX̱EṈ YȺYEQ
    await page.getByLabel('Transcript').fill('PEL SEK ANE TEṈ SE SA CEṈ');
    await page.getByTitle('Play').click();
    await page.getByTitle('validate').click({ force: true });
    const letters = await page.locator('span.letter.feedback').all();
    for (const letter of letters)
      expect(letter, 'input is correct').toHaveClass(
        /btn-outline-(success|warning|danger)/
      );
    await expect(
      completedList.locator('li').last().locator('span.status'),
      'expect first completed item to give positive feedback'
    ).toHaveClass(/danger/);
  });

  test('check file import handling', async ({ page }) => {
    await page
      .getByTestId('activity_loader_input')
      .setInputFiles('e2e/fixtures/test-config.json');
    await expect(
      page.getByText(/File data is unfamiliar/).last(),
      'alert config loaded'
    ).toBeVisible();

    await page
      .getByTestId('activity_loader_input')
      .setInputFiles('e2e/fixtures/test-data.json');
    await expect(
      page.getByText(/File data is unfamiliar/).last(),
      'alert data loaded'
    ).toBeVisible();

    await page
      .getByTestId('activity_loader_input')
      .setInputFiles('e2e/fixtures/test-activity.json');
    await expect(
      page.getByText(/Activity has be loaded/).last(),
      'alert config loaded'
    ).toBeVisible();
  });
});
