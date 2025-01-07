import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnInit,
  OnChanges,
  input,
  ElementRef,
  viewChild,
} from '@angular/core';
import { EveryVoiceService } from '../every-voice.service';
import WaveSurfer from 'wavesurfer.js';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import '@material/web/button/filled-button';
import '@material/web/button/filled-tonal-button';
import '@material/web/button/outlined-button';
import '@material/web/iconbutton/outlined-icon-button';
import '@material/web/iconbutton/filled-icon-button';
import '@material/web/progress/linear-progress';
import '@material/web/textfield/outlined-text-field';

import {
  TranscribingActivityConfigurationMeta,
  Word,
  ActivityStatus,
  TranscribingActivityValidatorFeedback,
  str_phone_approx,
  str_special_chars,
  str_tokenizer,
} from '../@types';

@Component({
  selector: 'app-transcribing-activity',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './transcribing-activity.component.html',
  styleUrl: './transcribing-activity.component.scss',
  standalone: true,
})
export class TranscribingActivityComponent implements OnInit, OnChanges {
  activity_data_url = input.required<string>();
  activity_config_url = input.required<string>();

  user_input_element = viewChild<ElementRef<HTMLTextAreaElement>>('userInput');

  activity_config: TranscribingActivityConfigurationMeta | undefined;
  activity_data: Word[] = [];
  current_words: Word[] = [];
  completed_words: Word[] = [];
  completed_words_validation: boolean[] = [];
  special_chars: string[];
  current_audio_url: Subject<string>;
  current_word: Word | undefined;
  wave_surfer: WaveSurfer | undefined;
  user_input: string | undefined;
  status: ActivityStatus = 'loading';
  completed = 0;
  total = 0;
  start_time = -1;
  duration = 0;
  is_synthesizing = false;
  is_validating = false;
  synthesizer_options: { [key: string]: string };
  validation_results: TranscribingActivityValidatorFeedback[];
  correct_form: string[][] = [];
  user_form: string[][] = [];
  results_history: TranscribingActivityValidatorFeedback[][] = [];
  api_status: 'online' | 'offline' | 'initializing' = 'initializing';

  numberOfErrors = 0;
  constructor(
    private every_voice: EveryVoiceService,
    private toastr: ToastrService
  ) {
    this.current_audio_url = new Subject<string>();
    this.synthesizer_options = {};
    this.special_chars = str_special_chars;
    this.validation_results = [];
  }

  ngOnChanges() {
    if (this.activity_config_url()) {
      fetch(this.activity_config_url()).then((data) =>
        data.json().then((data) => {
          this.activity_config = data;
          this.synthesizer_options = {};
          if (data.speaker) {
            this.synthesizer_options['speaker'] = data.speaker;
          }
          if (data.lang) {
            this.synthesizer_options['language'] = data.lang;
          }
          if (data.duration_control) {
            this.synthesizer_options['duration_control'] =
              data.duration_control;
          }
          if (data.api) {
            fetch(
              data.api.substr(0, data.api.lastIndexOf('/')) + '/gradio_api/info'
            )
              .then(() => {
                this.api_status = 'online';
                this.toastr.success('API endpoint is reachable', 'API Status');
              })
              .catch((err) => {
                this.api_status = 'offline';
                this.toastr.error(
                  `API endpoint could not be reached \n${err}`,
                  'API Status'
                );
              });
          } else {
            this.api_status = 'offline';
          }
        })
      );
      this.resetActivity();
    }

    if (this.activity_data_url()) {
      fetch(this.activity_data_url()).then((data) =>
        data.json().then((data) => {
          this.activity_data = data;
          this.status = 'loaded';
        })
      );
    }
  }

  ngOnInit(): void {
    //console.log('activity init');

    this.current_audio_url.subscribe((url) => {
      console.log('called');
      this.wave_surfer?.load(url);
      this.is_synthesizing = false;
      this.status = 'playing';
    });
  }
  playCurrentAudio(): void {
    this.user_input_element()?.nativeElement.focus();
    this.wave_surfer?.play();
  }
  stopCurrentAudio(): void {
    this.wave_surfer?.stop();
  }
  pauseCurrentAudio(): void {
    this.wave_surfer?.pause();
    this.user_input_element()?.nativeElement.focus();
  }
  hasSynthesizedAudio(): boolean {
    if (this.wave_surfer && this.wave_surfer.getDuration() !== undefined)
      return this.wave_surfer.getDuration() > 0;
    return false;
  }
  insertAlphabet(text: string) {
    const startPos = this.user_input_element()?.nativeElement.selectionStart;

    this.user_input_element()?.nativeElement.setRangeText(
      text,
      startPos ?? -1,
      text.length + (startPos ?? 0),
      'end'
    );

    this.user_input_element()?.nativeElement.focus();
  }
  validateUserInput() {
    this.playCurrentAudio();
  }
  resetActivity() {
    this.current_words = [];
    this.completed = 0;
    this.completed_words = [];
    this.completed_words_validation = [];
    this.wave_surfer?.empty();
  }
  startActivity() {
    if (this.status !== 'loaded' && this.status !== 'completed') return;
    if (this.activity_config) {
      if (this.wave_surfer == undefined) {
        this.wave_surfer = new WaveSurfer({
          container: '#waveform',
          waveColor: '#565e75',
          progressColor: '#262e45',
          autoplay: true,
        });
        this.wave_surfer?.on('finish', () => {
          this.user_input_element()?.nativeElement?.focus();
        });
      }
      const indices: number[] = [];
      this.resetActivity();
      this.total = this.activity_config.limit
        ? this.activity_data.length > this.activity_config.limit
          ? this.activity_config.limit
          : this.activity_data.length
        : this.activity_data.length < 10
        ? this.activity_data.length
        : 10;
      while (indices.length < this.total) {
        const index = Math.floor(Math.random() * this.activity_data.length);
        if (indices.includes(index)) continue;
        const data: Word | null = this.activity_data[index] ?? null;

        if (data == null) continue;
        if (data.orthography != undefined) {
          indices.push(index);
          this.current_words.push(data);
        }
      }
      this.synthesizeNext();
    }
  }
  synthesizeNext() {
    if (this.completed >= this.total) {
      this.activityCompleted();
      return;
    }
    if (this.current_words.length) {
      this.current_word = this.current_words[this.completed];
      this.is_synthesizing = true;
      this.is_validating = false;
      this.correct_form = [];
      this.user_form = [];

      this.every_voice
        .synthesize(
          this.current_word.orthography,
          this.synthesizer_options,
          this.activity_config?.api
        )
        .then((url) => {
          if (url.length) {
            if (this.current_word) this.current_word.url = url;

            this.user_input = '';
            //console.log(this.current_word, url);
            this.current_audio_url.next(url);
          } else {
            this.toastr.error('Failed to synthesize text');
          }
        });
    }
  }

  getProgress(): number {
    return Math.floor((this.completed / this.total) * 100);
  }

  validateTranscription() {
    this.validation_results = [];
    this.is_validating = true;
    this.status = 'paused';
    const orthography: string = this.current_word?.orthography as string;
    const user_input = this.user_input_element()?.nativeElement.value as string;

    this.correct_form = orthography
      .trim()
      .replaceAll('  ', ' ')
      .split(/ /gu)
      .map((word) => str_tokenizer(word).filter((letter) => letter != ''));

    this.user_form = user_input
      .trim()
      .replaceAll('  ', ' ')
      .toLocaleUpperCase()
      .split(/ /gu)
      .map((word) => str_tokenizer(word).filter((letter) => letter != ''));
    this.user_input = user_input;
    const padChar = '_';
    const numOfWords = Math.max(
      this.user_form.length,
      this.correct_form.length
    );
    console.log(
      numOfWords,
      `'${orthography}'`,
      this.correct_form,
      `'${user_input}'`,
      this.user_form
    );
    while (this.user_form.length < numOfWords) this.user_form.push([]);
    while (this.correct_form.length < numOfWords) this.correct_form.push([]);
    //console.log(this.correct_form, this.user_form);
    if (this.user_form && this.correct_form)
      for (const w in this.user_form) {
        const padSize = Math.max(
          this.correct_form[w].length,
          this.user_form[w].length
        );
        console.log(this.correct_form[w], this.user_form[w]);
        while (this.correct_form[w].length < padSize) {
          this.correct_form[w].push(padChar);
        }
        while (this.user_form[w].length < padSize) {
          this.user_form[w].push(padChar);
        }
        //console.log(this.correct_form[w], this.user_form[w]);
        for (const l in this.user_form[w]) {
          const letter = this.user_form[w][l];
          const source_letter = this.correct_form[w][l];
          const validation: TranscribingActivityValidatorFeedback = {
            char: letter,
          }; //default is wrong
          if (letter != undefined)
            if (letter === source_letter) {
              validation.status = 'exact';
            } else if (
              letter.toLocaleUpperCase() === source_letter.toLocaleUpperCase()
            ) {
              validation.status = 'case_insensitive';
            } else if (
              str_phone_approx(letter.toLocaleUpperCase()) ===
              str_phone_approx(source_letter.toLocaleUpperCase())
            ) {
              validation.status = 'phon_approx';
            } else if (
              letter.localeCompare(source_letter, 'en', {
                sensitivity: 'base',
              }) == 0
            ) {
              validation.status = 'accent_insensitive';
            }
          this.validation_results.push(validation);
        }
        //add spaces
        if (this.user_form.length > 1)
          this.validation_results.push({ status: 'exact', char: ' ' });
      }
    this.completed++;
    if (this.current_word) {
      this.completed_words.push(this.current_word);
      //
      if (
        this.validation_results.filter(
          (validation) => validation.status == undefined
        ).length > 0
      ) {
        this.completed_words_validation.push(false);
      } else {
        const validator_level = this.activity_config?.validator_level;
        //console.log(validator_level);

        if (validator_level === 'exact') {
          this.completed_words_validation.push(
            this.validation_results.filter(
              (validation) => validation.status !== 'exact'
            ).length === 0
          );
        } else if (validator_level === 'case_insensitive') {
          this.completed_words_validation.push(
            this.validation_results.filter(
              (validation) =>
                !['exact', 'in'].includes(validation.status as string)
            ).length === 0
          );
        } else {
          this.completed_words_validation.push(
            this.validation_results.filter(
              (validation) =>
                validator_level !== 'phon_approx' ||
                validation.status !== 'accent_insensitive'
            ).length > 0
          );
        }
      }
    }
    if (this.completed >= this.total) {
      setTimeout(() => this.activityCompleted(), 1200);
    }
  }
  feedBackClassList(index: number): string {
    const classes = ['letter', 'btn'];
    if (this.validation_results[index]) {
      let feedback = 'btn-outline-danger';
      switch (this.validation_results[index].status) {
        case 'exact':
          feedback = 'btn-outline-success';
          break;
        case 'case_insensitive':
          feedback = 'btn-outline-secondary fw-bold';
          break;
        case 'phon_approx':
          feedback = 'btn-outline-info fst-italic';
          break;
        case 'accent_insensitive':
          feedback = 'btn-outline-warning';
          break;
      }
      if (this.validation_results[index].char == '_')
        feedback = 'btn-outline-danger extra';
      classes.push(feedback);
    }
    if (this.validation_results[index].char == ' ') return `me-3`;
    return classes.join(' ');
  }
  activityCompleted() {
    this.status = 'completed';
    //clearInterval(this.timer);
  }
  user_typed($event: Event) {
    this.user_input = ($event.currentTarget as HTMLInputElement)?.value;
  }
}
