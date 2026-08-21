import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forgotpassworddialog } from './forgotpassworddialog';

describe('Forgotpassworddialog', () => {
  let component: Forgotpassworddialog;
  let fixture: ComponentFixture<Forgotpassworddialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forgotpassworddialog],
    }).compileComponents();

    fixture = TestBed.createComponent(Forgotpassworddialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
