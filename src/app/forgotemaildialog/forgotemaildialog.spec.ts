import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forgotemaildialog } from './forgotemaildialog';

describe('Forgotemaildialog', () => {
  let component: Forgotemaildialog;
  let fixture: ComponentFixture<Forgotemaildialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forgotemaildialog],
    }).compileComponents();

    fixture = TestBed.createComponent(Forgotemaildialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
