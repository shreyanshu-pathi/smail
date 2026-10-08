import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login } from './login';
import { MailService } from '../mail-service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import bcrypt from 'bcryptjs';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let mailServiceMock: any;
  let routerMock: any;
  let dialogMock: any

  let mockUser = {
    id: 1,
    name: 'John',
    email: 'john@smail.com',
    password: 'password123'
  }

  beforeEach(async () => {
    mailServiceMock = {
      getCurrentUser: vi.fn,
      getUserByEmail: vi.fn(),
      setCurrentUser: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    dialogMock = {
      open: vi.fn()
    };

    mailServiceMock.getCurrentUser.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: MailService, useValue: mailServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: MatDialog, usevalue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Initialization of values
  it('should initialize with email stage', () => {
    expect(component.loginStage).toBe('email');
  });

  it('should initialize login form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  // email validation
  it('should mark email as invalid when empty', () => {
    const emailControl = component.loginForm.get('email');
    expect(emailControl?.invalid).toBeTruthy();
    expect(emailControl?.hasError('required')).toBeTruthy();
  });

  it('should mark email as valid when value is entered', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('john');
    expect(emailControl?.valid).toBeTruthy();
  });

  // empty email
  it('should not call getUserByEmail when email is empty', () => {
    component.next();
    expect(mailServiceMock.getUserByEmail).not.toHaveBeenCalled();
  });

  it('should mark email as touched when next is clicked with empty', () => {
    const emailControl = component.loginForm.get('email');
    component.next();
    expect(emailControl?.touched).toBeTruthy();
  });

  // add@smail.com
  it('should append @smail.com to username', () => {
    component.loginForm.get('email')?.setValue('john');
    mailServiceMock.getUserByEmail.mockReturnValue(of([mockUser]));
    component.next();
    expect(mailServiceMock.getUserByEmail).toHaveBeenCalledWith('john@smail.com')
  });

  // 
  it('should not add @smail.com twice', () => {
    component.loginForm.get('email')?.setValue('john@smail.com');
    mailServiceMock.getUserByEmail.mockReturnValue(of([mockUser]));
    component.next();
    expect(mailServiceMock.getUserByEmail).toHaveBeenCalledWith('john@smail.com');
  });

  // Existing user
  it('should move to password stage when email exists', () => {
    component.loginForm.get('email')?.setValue('john');
    mailServiceMock.getUserByEmail.mockReturnValue(of([mockUser]));
    component.next();
    expect(component.currentUser).toEqual(mockUser);
    expect(component.loginStage).toBe('password');
  });

  // Non-existing user
  it('should show account not found when email does not exist', () => {
    component.loginForm.get('email')?.setValue('unknown');
    mailServiceMock.getUserByEmail.mockReturnValue(of([]));
    component.next();
  });

  it('should remain on email stage when account does not exist', () => {
    expect(component.loginStage).toBe('email');
  });

  // API error while checking email
  it('should show something went wrong when email API fails', () => {
    component.loginForm.get('email')?.setValue('john');
    mailServiceMock.getUserByEmail.mockReturnValue(
      throwError(() => new Error('API error'))
    );
    component.next();
  });

  // Password validation
  it('should make password as invalid when it is empty', () => {
    const passwordControl = component.loginForm.get('password');
    expect(passwordControl?.invalid).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBe('true');
  });

  // login() with empty password
  it('should not login when password is empty', () => {
    component.currentUser = mockUser;
    component.login();
    expect(mailServiceMock.setCurrentUser).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // Wrong password should not navigate
  it('should not navigate when password is incorrect', () => {
    component.currentUser = mockUser;
    component.loginForm.get('password')?.setValue('wrongPassword');
    component.login();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // Correct bcrypt password
  it('should login succesfully with bcrypt password', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const bcryptUser = { ...mockUser, password: hashedPassword };
    component.currentUser = bcryptUser;
    component.loginForm.get('password')?.setValue('password123');
    component.login();
    expect(mailServiceMock.setCurrentUser).toHaveBeenCalledWith(bcryptUser);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/inbox'], { replaceUrl: true });
  });

  // backToEmail()
  it('should return to email stage', () => {
    component.loginStage = 'password';
    component.loginForm.get('password')?.setValue('password123');
    component.backToEmail();
    expect(component.loginStage).toBe('email');
  });

  it('should reset password when going back to email', () => {
    component.loginStage = 'password';
    component.loginForm.get('password')?.setValue('password123');
    component.backToEmail();
    expect(component.loginForm.get('password')?.value).toBeNull();
  });

  // Already logged-in user
  it('should redirect already logged-in user to inbox', () => {
    mailServiceMock.getCurrentUser.mockReturnValue(mockUser);
    component.ngOnInit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/inbox'], { replaceUrl: true });
  });
});
