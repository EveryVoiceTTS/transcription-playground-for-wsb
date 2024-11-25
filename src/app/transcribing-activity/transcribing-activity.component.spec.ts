import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscribingActivityComponent } from './transcribing-activity.component';

describe('TranscribingActivityComponent', () => {
  let component: TranscribingActivityComponent;
  let fixture: ComponentFixture<TranscribingActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscribingActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranscribingActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
