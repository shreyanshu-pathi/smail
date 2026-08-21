import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComposeDialog } from './compose-dialog';

describe('ComposeDialog', () => {
  let component: ComposeDialog;
  let fixture: ComponentFixture<ComposeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComposeDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});