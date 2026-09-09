import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Logout } from './logout';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('Logout', () => {
  let component: Logout;
  let fixture: ComponentFixture<Logout>;

  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logout],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Logout);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();

    fixture.detectChanges()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // logout message
  it('should display the see you soon message', () => {
    const msg = fixture.nativeElement as HTMLElement;
    expect(msg.querySelector('h2')?.textContent).toContain('See you soon!');
  });

  // secure logout message 
  it('should display the secure logout message', () => {
    const msg = fixture.nativeElement as HTMLElement;
    expect(msg.querySelector('.secure-text')?.textContent).toContain("You've been securely logged out");
  });

  // login button
  it('should display the login button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loginButton = compiled.querySelector('button');
    expect(loginButton).toBeTruthy();
    expect(loginButton?.textContent?.trim()).toBe('Login');
  });

  // Login button navigation
  // it('should navigate to login when Login button is clicked', async () => {
  //   const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  //   const compiled = fixture.nativeElement as HTMLElement;
  //    const routerLink = fixture.debugElement
  //   .query(By.css('button'))
  //   .injector.get(RouterLink);
  //   expect(routerLink.routerLink).toEqual(['/login']);
  // });
});
