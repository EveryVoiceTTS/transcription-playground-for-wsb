import { Injectable } from '@angular/core';
import { Client } from '@gradio/client';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EveryVoiceService {
  client: Client | undefined;
  API_URL: string;
  constructor() {
    this.API_URL = environment.EVERY_VOICE_API;
  }
  /**
   *
   * @param str
   * @param options optional
   * @param apiEndPoint optional
   * @returns
   */

  async synthesize(
    str: string,
    options: {} = {},
    apiEndPoint = 'partial'
  ): Promise<string> {
    let url = apiEndPoint;
    //console.log('synthesize', str, options, apiEndPoint);
    const defaults = {
      duration_control: 0.75,
      language: 'str',
      speaker: 'penac',
    };
    if (
      apiEndPoint.startsWith('http') &&
      (environment.EVERY_VOICE_API.length < 1 ||
        !apiEndPoint.includes(environment.EVERY_VOICE_API))
    ) {
      this.API_URL = apiEndPoint.substring(0, apiEndPoint.lastIndexOf('/'));
    }
    url = url.replace(this.API_URL, '');
    //console.log('synthesize', str, options, url, this.API_URL);
    if (this.client == undefined) {
      this.client = await Client.connect(this.API_URL);
    }

    const result = await this.client?.predict(`${url}`, {
      text: str,
      ...defaults,
      ...options,
    });

    if ((result?.data as any[]).length) {
      url = (result?.data as any[])[0]['url'];
    }
    //console.log(url);
    return url;
  }
}
