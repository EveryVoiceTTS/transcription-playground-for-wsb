import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscribingActivityConfigurationComponent } from './transcribing-activity-configuration.component';

describe('TranscribingActivityConfigurationComponent', () => {
  let component: TranscribingActivityConfigurationComponent;
  let fixture: ComponentFixture<TranscribingActivityConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscribingActivityConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscribingActivityConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
