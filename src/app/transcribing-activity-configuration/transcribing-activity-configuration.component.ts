import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';

import '@material/web/button/filled-button';
import '@material/web/button/filled-tonal-button';
import '@material/web/button/outlined-button';
import '@material/web/switch/switch';
import '@material/web/slider/slider';
import '@material/web/select/outlined-select';
import '@material/web/select/select-option';
import '@material/web/textfield/outlined-text-field';
import '@material/web/tabs/primary-tab';

import { ToastrService } from 'ngx-toastr';

import {
  ReadFile,
  TranscribingActivityValidatorLevel,
  utf8_to_b64,
  b64_to_utf8,
  Word,
} from '../@types';
import { TranscribingActivityComponent } from '../transcribing-activity/transcribing-activity.component';
import {
  TranscribingActivityConfigurationMeta,
  WriteActivityConfiguration,
} from '../@types';

@Component({
  selector: 'app-transcribing-activity-configuration',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranscribingActivityComponent],
  templateUrl: './transcribing-activity-configuration.component.html',
  styleUrls: [
    './transcribing-activity-configuration.component.scss',
    '../app.materials.vars.scss',
  ],
  standalone: true,
})
export class TranscribingActivityConfigurationComponent implements OnInit {
  activityConfigurationForm: FormGroup;
  data: Word[];
  new_word: string;
  dataURL: string = '';
  configURL: string = '';
  api_is_reachable = false;
  configStep = 1;
  activityConfigurationActiveTab = 1;
  activityDataActiveTab = 1;
  constructor(
    private _formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    this.activityConfigurationForm = this._formBuilder.group({
      title: new FormControl<string>('', Validators.required),

      description: new FormControl<string>(''),

      text_instructions: new FormControl<string>(''),

      limit: new FormControl<number>(10, Validators.required),
      randomize: new FormControl<boolean>(true, Validators.required),

      speaker: new FormControl<string>('penac', Validators.required),
      lang: new FormControl<string>('str', Validators.required),
      api: new FormControl<string>('', Validators.required),
      validator_level: new FormControl<TranscribingActivityValidatorLevel>(
        'accent_insensitive',
        Validators.required
      ),
      duration_control: new FormControl<number>(1, Validators.required),
    });
    this.data = [];
    this.new_word = '';
    this.update_api_status();
  }
  configuration(): TranscribingActivityConfigurationMeta {
    const $form = this.activityConfigurationForm.value;
    return $form;
  }

  saveActivity() {
    const $data: TranscribingActivityConfigurationMeta = this.configuration();
    if ($data.title) {
      WriteActivityConfiguration(
        JSON.stringify($data),
        `${$data.title}-activity-configuration`
      );
      this.toastr.success('Activity parameters have be saved', 'Save Activity');
    } else {
      this.toastr.error(
        'Activity parameters could not be saved\nPlease Provide a title',
        'Save Activity'
      );
    }
  }

  saveWordList() {
    console.log('save', this.data);
    if (this.data.length) {
      WriteActivityConfiguration(JSON.stringify(this.data), 'data');
      this.toastr.success('Activity data have be saved', 'Save Activity');
    } else {
      this.toastr.error(
        'There is no activity data to be saved',
        'Save Activity'
      );
    }
  }
  ngOnInit(): void {}
  addWord($event: Event): void {
    const words: Word[] = this.new_word
      .split('\n')
      .filter((word) => word.trim().length > 1)
      .map((word) => {
        return { orthography: word.trim() };
      });
    console.log('add', words, this.new_word);
    this.data = [...this.data, ...words];
    this.new_word = '';
    $event.preventDefault();
  }
  runActivity() {
    if (this.activityConfigurationForm.value.title.length < 2) {
      this.toastr.error('Please provide an activity name');
      this.configStep = 1;
      this.activityConfigurationActiveTab = 0;
      return;
    }
    if (this.activityConfigurationForm.value.api.length < 4) {
      this.toastr.error('Please provide an synthesizer API URL');
      this.configStep = 1;
      this.activityConfigurationActiveTab = 0;
      return;
    }
    if (this.data.length < 1) {
      this.toastr.error('Please add some data first');
      this.configStep = 1;
      this.activityDataActiveTab = 0;
      return;
    }
    console.log('run activity', this.configuration());
    this.configURL = '';
    this.configURL = `data:application/json;base64,${utf8_to_b64(
      JSON.stringify(this.configuration())
    )}`;
    this.dataURL = `data:application/json;base64,${utf8_to_b64(
      JSON.stringify(this.data)
    )}`;
    this.configStep = 3;
  }
  update_config(key: string, $event: Event) {
    const patch = {
      [key]: ($event.currentTarget as HTMLInputElement).value,
    };

    this.activityConfigurationForm.patchValue(patch);
    this.update_api_status();
  }
  update_duration($event: Event) {
    this.activityConfigurationForm.patchValue({
      duration_control: parseFloat(
        ($event.currentTarget as HTMLInputElement)?.value
      ),
    });
  }
  update_validator_level($event: Event) {
    this.activityConfigurationForm.patchValue({
      validator_level: ($event.currentTarget as HTMLInputElement).value,
    });
  }
  toggle_randomize() {
    this.activityConfigurationForm.patchValue({
      randomize: !this.activityConfigurationForm.value.randomize,
    });
  }
  loadPreviousConfig($event: Event) {
    if (
      ($event.currentTarget as HTMLInputElement).files == null ||
      ($event.currentTarget as HTMLInputElement).files?.length == 0
    ) {
      return;
    }
    ReadFile($event, (text: string) => {
      console.log('loadPreviousConfig', text);
      this.activityConfigurationForm.patchValue(
        JSON.parse(b64_to_utf8(text.substring(text.indexOf('base64,') + 7)))
      );
      this.toastr.success(
        'Activity parameters have be loaded',
        'Load Activity'
      );
      if (this.activityConfigurationForm.value.title.length)
        this.configStep = 2;
    });
  }
  loadPreviousData($event: Event) {
    if (
      ($event.currentTarget as HTMLInputElement).files == null ||
      ($event.currentTarget as HTMLInputElement).files?.length == 0
    ) {
      return;
    }
    ReadFile($event, (text: string) => {
      console.log('loadPreviousData', text);
      const data = JSON.parse(
        b64_to_utf8(text.substring(text.indexOf('base64,') + 7))
      );
      if (data[0] !== undefined && data[0]['orthography']) {
        this.data = data as Word[];

        this.toastr.success(
          'Activity data have be loaded',
          'Import Activity Data'
        );
        if (this.activityConfigurationForm.value.title.length)
          this.runActivity();
      } else {
        this.toastr.error('File format not recognized', 'Import Activity Data');
      }
    });
  }
  update_api_status() {
    if (this.activityConfigurationForm.value.api.length)
      fetch(this.activityConfigurationForm.value.api, { method: 'OPTIONS' })
        .then(() => {
          this.api_is_reachable = true;
          this.toastr.success('API endpoint is reachable', 'API Status');
        })
        .catch((err) => {
          this.api_is_reachable = false;
          this.toastr.error(
            `API endpoint could not be reached \n${err}`,
            'API Status'
          );
        });
  }
  updateData($event: Event) {
    this.new_word = ($event.currentTarget as HTMLInputElement)?.value;
  }
}
