import { Component } from '@angular/core';
import { b64_to_utf8, utf8_to_b64, ReadFile } from '../@types';
import { ToastrService } from 'ngx-toastr';
import { TranscribingActivityComponent } from '../transcribing-activity/transcribing-activity.component';

@Component({
  selector: 'app-transcribing-activity-loader',
  imports: [TranscribingActivityComponent],
  templateUrl: './transcribing-activity-loader.component.html',
  styleUrl: './transcribing-activity-loader.component.css',
})
export class TranscribingActivityLoaderComponent {
  dataURL: string = '';
  configURL: string = '';
  constructor(private toastr: ToastrService) {}
  loadActivity($event: Event) {
    if (
      ($event.currentTarget as HTMLInputElement).files == null ||
      ($event.currentTarget as HTMLInputElement).files?.length == 0
    ) {
      return;
    }
    ReadFile($event, (text: string) => {
      console.log('loadActivity', text);
      const input = JSON.parse(
        b64_to_utf8(text.substring(text.indexOf('base64,') + 7))
      );
      if (
        input.configuration &&
        input.configuration.title.length &&
        input.data.length
      ) {
        this.configURL = `data:application/json;base64,${utf8_to_b64(
          JSON.stringify(input.configuration)
        )}`;
        this.dataURL = `data:application/json;base64,${input.data}`;
        this.toastr.success('Activity  have be loaded');
      } else {
        this.toastr.error('File data is unfamiliar');
      }
    });
  }
}
