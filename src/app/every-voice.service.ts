import { Injectable } from '@angular/core';
//import { Client } from '@gradio/client';
import { environment } from '../environments/environment';
import { ToastrService } from 'ngx-toastr';
@Injectable({
  providedIn: 'root',
})
export class EveryVoiceService {
  //client: Client | undefined;
  API_URL: string;
  session_hash: string;
  constructor(private toastr: ToastrService) {
    this.API_URL = environment.EVERY_VOICE_API;
    this.session_hash = this.generateSessionHash();
  }
  generateSessionHash(): string {
    let session_hash = '';
    const session_hashLength = Math.floor(Math.random() * 32);
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    for (let index = 0; index < session_hashLength; index++) {
      session_hash += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return session_hash;
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
    return await this.generate(
      {
        text: str,
        ...defaults,
        ...options,
      },
      this.API_URL
    );
    //Gradio client
    /*
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
    return url;*/
  }
  /**
   * Manual way to get data from Gradio API until GradioClient is fixed
   * @param data
   * @param baseURL string
   * @returns url
   */

  async generate(data: any, baseURL: string): Promise<string> {
    let url = '';
    const session_hash = this.generateSessionHash();
    //sythensize
    const response = await fetch(baseURL + '/gradio_api/queue/join', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        mode: 'no-cors',
      }),
      body: JSON.stringify({
        data: [data.text, data.duration_control, data.language, data.speaker],
        session_hash: session_hash,
        fn_index: 0,
        event_data: null,
        trigger_id: null,
      }),
      //body: `{ "data": ["${data.text}", ${data.duration_control}, "${data.language}", "${data.speaker}"], "session_hash": "${session_hash}", "fn_index": 0, "event_data": null, "trigger_id": null }`,
    });
    const json = await response.json();
    console.log('syn ', json);
    if (json.event_id) {
      this.toastr.success('Audio generated');
      const response = await fetch(
        baseURL + '/gradio_api/queue/data?session_hash=' + session_hash
      );
      const responseText = await response.text();
      const queue = responseText.split('\n');

      for (const line of queue) {
        if (!line.includes('}')) continue;

        const json = JSON.parse(line.substring(line.indexOf('{')).trim());
        if (json.output) {
          if (
            json.output.data &&
            json.output.data[0] &&
            json.output.data[0].url
          )
            return json.output.data[0].url;
        }
      }
      this.toastr.error('Audio could not be retrieved');
    } else {
      this.toastr.error('Audio could not be generated');
    }

    return url;
  }
}
