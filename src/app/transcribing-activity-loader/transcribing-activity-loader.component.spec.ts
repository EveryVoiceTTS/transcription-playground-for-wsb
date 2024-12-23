import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscribingActivityLoaderComponent } from './transcribing-activity-loader.component';

describe('TranscribingActivityLoaderComponent', () => {
  let component: TranscribingActivityLoaderComponent;
  let fixture: ComponentFixture<TranscribingActivityLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscribingActivityLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscribingActivityLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
