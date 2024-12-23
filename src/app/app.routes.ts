import { Routes } from '@angular/router';
import { TranscribingActivityConfigurationComponent } from './transcribing-activity-configuration/transcribing-activity-configuration.component';
import { TranscribingActivityLoaderComponent } from './transcribing-activity-loader/transcribing-activity-loader.component';
export const routes: Routes = [
  {
    path: '',
    component: TranscribingActivityLoaderComponent,
  },
  {
    path: 'create',
    component: TranscribingActivityConfigurationComponent,
  },
];
