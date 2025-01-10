import { Page } from 'playwright/test';

export const mockEveryVoiceAPI = async (page: Page) => {
  await page.route('https://mock-api.dev/gradio_api/info', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: {} });
  });
  await page.route(
    'https://mock-api.dev/gradio_api/queue/join',
    async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        json: { event_id: 'abcd1234' },
      });
    }
  );
  await page.route(
    'https://mock-api.dev/gradio_api/queue/data**',
    async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: `data: {"msg":"estimation","event_id":"abcd1234","rank":0,"queue_size":1,"rank_eta":0.8395884182988381}

data: {"msg":"process_starts","event_id":"abcd1234","eta":0.8395884182988381}

data: {"msg":"process_completed","event_id":"abcd1234","output":{"data":[{"path":"/tmp/gradio/abcd1234/audio.mp3","url":"https://mock-api.dev/gradio_api/file=/tmp/gradio/abcd1234/audio.mp3","size":null,"orig_name":"audio.mp3","mime_type":null,"is_stream":false,"meta":{"_type":"gradio.FileData"}}],"is_generating":false,"duration":0.38480591773986816,"average_duration":0.7159850692749024,"render_config":null,"changed_state_ids":[]},"success":true,"title":null}

data: {"msg":"close_stream","event_id":null}`,
      });
    }
  );
  await page.route(
    'https://mock-api.dev/gradio_api/file=/tmp/gradio/abcd1234/audio.mp3',
    async (route) => {
      await route.fulfill({
        contentType: 'audio/mpeg',
        path: 'e2e/fixtures/audio.mp3',
      });
    }
  );
};
