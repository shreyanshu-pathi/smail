import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLabelDialog } from './create-label-dialog';

describe('CreateLabelDialog', () => {
  let component: CreateLabelDialog;
  let fixture: ComponentFixture<CreateLabelDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLabelDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateLabelDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
