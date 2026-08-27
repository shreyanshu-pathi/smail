import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnoozeDialog } from './snooze-dialog';

describe('SnoozeDialog', () => {
  let component: SnoozeDialog;
  let fixture: ComponentFixture<SnoozeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnoozeDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(SnoozeDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
