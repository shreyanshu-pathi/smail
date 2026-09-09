import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';
import { provideRouter, Router } from '@angular/router';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([])

      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();

    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // initialization
  it('should display the smail logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.gmail-text')?.textContent).toContain('Smail');
  });

  // navigate to signup
  it('should navigate to signup when gotosignup is called', () => {
    component.goToSignup();
    expect(router.navigate).toHaveBeenCalledWith(['/signup']);
  });

  // navigate to login
  it('should navigate to signup when gotologin is called', () => {
    component.goToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // get started button
  it('should navigate to signup when get started button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    const getStartedButton = (Array.from(buttons) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'Get Started');
    expect(getStartedButton).toBeDefined();
    getStartedButton!.click();
    expect(router.navigate).toHaveBeenCalledWith(['/signup']);
  });

  // header signin button
  it('should navigate to login when get started button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const signInButton = (Array.from(buttons) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'Sign in');
    expect(signInButton).toBeDefined();
    signInButton!.click();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // create an account button
  it('should navigate to signup when create an account is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const createAccountButton = (Array.from(buttons) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'Create an account') as HTMLButtonElement;

    createAccountButton.click();
    expect(router.navigate).toHaveBeenCalledWith(['/signup']);
  });

  // signin
  it('should navigate to login where hero sign in button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const signInButtons = (Array.from(buttons) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'Sign in') as HTMLButtonElement;

    signInButtons.click();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
