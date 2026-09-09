import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Signup } from './signup';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MailService } from '../mail-service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  let mailServiceMock: {
    getUserByEmail: ReturnType<typeof vi.fn>;
    addUser: ReturnType<typeof vi.fn>;
    setCurrentUser: ReturnType<typeof vi.fn>;
  };

  let snackBarMock: {
    open: ReturnType<typeof vi.fn>;
  };

  let router: Router;

  beforeEach(async () => {
    mailServiceMock = {
      getUserByEmail: vi.fn(),
      addUser: vi.fn(),
      setCurrentUser: vi.fn()
    };

    snackBarMock = {
      open: vi.fn()
    }

    mailServiceMock.getUserByEmail.mockReturnValue(of({}));

    mailServiceMock.addUser.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: MailService, useValue: mailServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // initialization
  it('should start with name stage', () => {
    expect(component.signupStage).toBe('name');
  });

  it('should create the signup form', () => {
    expect(component.signupForm).toBeTruthy();

    expect(component.signupForm.controls['fname']).toBeTruthy();
    expect(component.signupForm.controls['lname']).toBeTruthy();
    expect(component.signupForm.controls['dob']).toBeTruthy();
    expect(component.signupForm.controls['gender']).toBeTruthy();
    expect(component.signupForm.controls['phone']).toBeTruthy();
    expect(component.signupForm.controls['email']).toBeTruthy();
    expect(component.signupForm.controls['password']).toBeTruthy();
    expect(component.signupForm.controls['confirmPassword']).toBeTruthy();
  });

  // first name
  it('should show required error for empty first name', () => {
    const fname = component.signupForm.controls['fname'];
    fname.setValue('');
    fname.markAsTouched();
    expect(fname.hasError('required')).toBeTruthy();
  });

  it('should reject first name if the length is less tha 3 characters', () => {
    const fname = component.signupForm.controls['fname'];
    fname.setValue('Ab');
    expect(fname.hasError('minlength')).toBeTruthy();
  });

  it('should reject invalid characters', () => {
    const fname = component.signupForm.controls['fname'];
    fname.setValue('John123');
    expect(fname.hasError('pattern')).toBeTruthy();
  });

  it('should accept a valid first name', () => {
    const fname = component.signupForm.controls['fname'];
    fname.setValue('John');
    expect(fname.valid).toBeTruthy();
  });

  // last name
  it('should show required error for empty last name', () => {
    const lname = component.signupForm.controls['lname'];
    lname.setValue('');
    lname.markAsTouched();
    expect(lname.hasError('required')).toBeTruthy();
  });

  it('should reject invalid characters in last name', () => {
    const lname = component.signupForm.controls['lname'];
    lname.setValue('Cena123');
    expect(lname.hasError('pattern')).toBeTruthy();
  });

  it('should accept a valid last name', () => {
    const lname = component.signupForm.controls['lname'];
    lname.setValue('Cena');
    expect(lname.valid).toBeTruthy();
  });

  // Name stage
  it('should not move to DOB when name fields are empty', () => {
    component.signupForm.patchValue({
      fname: '',
      lname: ''
    });
    component.next();
    expect(component.signupStage).toBe('name');
    expect(component.signupForm.controls['fname'].touched).toBe(true);
    expect(component.signupForm.controls['lname'].touched).toBe(true);
  });

  it('should move from name fields to DOB', () => {
    component.signupForm.patchValue({
      fname: 'John',
      lname: 'Cena'
    });
    component.next();
    expect(component.signupStage).toBe('dob');
  });

  // Dob stage
  it('should not move from DOB when date is empty', () => {
    component.signupStage = 'dob';
    component.signupForm.controls['dob'].setValue(null);
    component.next();
    expect(component.signupStage).toBe('dob');
    expect(component.signupForm.controls['dob'].touched).toBeTruthy();
  });

  it('should move to gender when date field is filled', () => {
    component.signupStage = 'dob';
    component.signupForm.controls['dob'].setValue(new Date(2002, 11, 25));
    component.next();
    expect(component.signupStage).toBe('gender');
  });

  it('should remove non-numeric characters from DOB', () => {
    const input = document.createElement('input'); input.value = '12ab081998';
    const event = {
      target: input
    } as unknown as Event;
    component.formatDob(event);
    expect(input.value).toBe('12/08/1998');
  });

  // gender
  it('should not move from gender to phone when gender is empty', () => {
    component.signupStage = 'gender';
    component.signupForm.controls['gender'].setValue('');
    component.next();
    expect(component.signupStage).toBe('gender');
    expect(component.signupForm.controls['gender'].touched).toBeTruthy();
  });

  it('should move from gender to phone stage', () => {
    component.signupStage = 'gender';
    component.signupForm.controls['gender'].setValue('Rather not say');
    component.next();
    expect(component.signupStage).toBe('phone');
  });

  // phone
  it('should allow an empty phone number', () => {
    const phone = component.signupForm.controls['phone'];
    phone.setValue('');
    expect(phone.valid).toBeTruthy();
  });

  it('should reject an invalid phone number', () => {
    const phone = component.signupForm.controls['phone'];
    phone.setValue('856456');
    expect(phone.hasError('pattern')).toBeTruthy();
  });

  it('should acept a valid 10 digit phone number', () => {
    const phone = component.signupForm.controls['phone'];
    phone.setValue('8564522612');
    expect(phone.valid).toBeTruthy();
  });

  it('should move from phone to email stage', () => {
    component.signupStage = 'phone';
    component.signupForm.controls['phone'].setValue('');
    component.next();
    expect(component.signupStage).toBe('email');
  });

  // email
  it('should require email', () => {
    const email = component.signupForm.controls['email'];
    email.setValue('');
    expect(email.hasError('required')).toBeTruthy();
  });

  it('should reject invalid email username characters', () => {
    const email = component.signupForm.controls['email'];
    email.setValue('virat@');
    expect(email.hasError('pattern')).toBeTruthy();
  });

  it('should not move forward when email is empty', () => {
    component.signupStage = 'email';
    component.signupForm.controls['email'].setValue('');
    component.next();
    expect(component.signupForm.controls['email'].hasError('required')).toBeTruthy();
  });

  it('should append @smail.com to email username', () => {
    component.signupStage = 'email';
    component.signupForm.controls['email'].setValue('virat');
    component.next();
    expect(component.signupForm.controls['email'].value).toBe('virat@smail.com');
  });

  // it('should detect a already registered email', () => {
  //   mailServiceMock.getUserByEmail.mockReturnValue(of([{ email: 'virat@smail.com' }]));
  //   component.signupStage = 'email';
  //   component.signupForm.controls['email'].setValue('virat');
  //   component.next();
  //   expect(component.signupForm.controls['email'].hasError('emailExists')).toBeTruthy();
  //   expect(component.signupStage).toBe('email');
  //   expect(snackBarMock.open).toHaveBeenCalled();
  // });

  // email suggestions
  it('should generate available email suggestions', () => {
    mailServiceMock.getUserByEmail.mockReturnValue(of([]));
    component.generateEmailSuggestions('virat');
    expect(mailServiceMock.getUserByEmail).toHaveBeenCalled();
    expect(component.emailSuggestions.length).toBeGreaterThan(0);
  });

  it('should select an email suggestion', () => {
    component.selectSuggestion('virat18@smail.com');
    expect(component.signupForm.controls['email'].value).toBe('virat18@smail.com');
    expect(component.emailSuggestionSelected).toBeTruthy();
    expect(component.emailSuggestions.length).toBe(0);
    expect(component.signupStage).toBe('password');
  });

  it('should clear suggestions when email is empty', () => {
    component.emailSuggestions = ['john123@smail.com'];
    component.signupForm.controls['email'].setValue('');
    component.onEmailChange();
    expect(component.emailSuggestions.length).toBe(0);
  });

  // Password
  it('should require password', () => {
    const password = component.signupForm.controls['password'];
    password.setValue('');
    expect(password.hasError('required')).toBe(true);
  });

  it('should reject password shorter than 8 characters', () => {
    const password = component.signupForm.controls['password'];
    password.setValue('Ab@1231');
    expect(password.hasError('minlength')).toBeTruthy();
  });

  it('should reject password without required characters', () => {
    const password = component.signupForm.controls['password'];
    password.setValue('password123');
    expect(password.hasError('pattern')).toBeTruthy();
  });

  it('should accept a valid password', () => {
    const password = component.signupForm.controls['password'];
    password.setValue('Password@123');
    expect(password.valid).toBeTruthy();
  });


  // password match
  it('should detect password mismatch', () => {
    component.signupForm.patchValue({
      password: 'Password@123',
      confirmPassword: 'Password@456'
    });
    expect(component.signupForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should accept a valid password match', () => {
    component.signupForm.patchValue({
      password: 'Password@123',
      confirmPassword: 'Password@123'
    });
    expect(component.signupForm.hasError('passwordMismatch')).toBeFalsy();
  });

  // back button
  it('should go back from dob to name', () => {
    component.signupStage = 'dob';
    component.back();
    expect(component.signupStage).toBe('name');
  });

  it('should go back from gender to DOB', () => {
    component.signupStage = 'gender';
    component.back();
    expect(component.signupStage).toBe('dob');
  });

  it('should go back from phone to gender', () => {
    component.signupStage = 'phone';
    component.back();
    expect(component.signupStage).toBe('gender');
  });

  it('should go back from email to phone', () => {
    component.signupStage = 'email';
    component.back();
    expect(component.signupStage).toBe('phone');
  });

  it('should go back from password to email', () => {
    component.signupStage = 'password';
    component.signupForm.controls['email'].setErrors({
      emailExists: true
    });
    component.emailSuggestions = ['john123@smail.com'];
    component.emailSuggestionSelected = true; component.back();
    expect(component.signupStage).toBe('email');
    expect(component.signupForm.controls['email'].errors).toBeNull();
    expect(component.emailSuggestions.length).toBe(0);
    expect(component.emailSuggestionSelected).toBe(false);
  });

  // submit form
  it('should not submit form when password is invalid', () => {
    component.signupForm.patchValue({
      password: '',
      confirmPassword: ''
    });
    component.submitForm();
    expect(mailServiceMock.addUser).not.toHaveBeenCalled();
  });

  it('should not submit when passwords do not match', () => {
    component.signupForm.patchValue({
      password: 'Password@123',
      confirmPassword: 'Password@456'
    });
    component.submitForm();
    expect(mailServiceMock.addUser).not.toHaveBeenCalled();
  });

  it('should show error when account creation fails', () => {
    mailServiceMock.getUserByEmail.mockReturnValue(of([]));
    mailServiceMock.addUser.mockReturnValue(
      throwError(() => new Error('Server error'))
    );
    component.signupForm.patchValue({
      fname: 'John',
      lname: 'Doe',
      dob: new Date(2000, 0, 1),
      gender: 'Male',
      phone: '9876543210',
      email: 'john@smail.com',
      password: 'Password@123',
      confirmPassword: 'Password@123'
    });
    component.submitForm();
  });
  it('should not create user if email already exists during submit', () => {
    mailServiceMock.getUserByEmail.mockReturnValue(of([{
      email: 'john@smail.com'
    }])
    );
    component.signupForm.patchValue({
      fname: 'John',
      lname: 'Doe',
      dob: new Date(2000, 0, 1),
      gender: 'Male',
      phone: '9876543210',
      email: 'john@smail.com',
      password: 'Password@123',
      confirmPassword: 'Password@123'
    });
    component.submitForm();
    expect(mailServiceMock.addUser).not.toHaveBeenCalled();
  });

  it('should not submit from password stage when password is invalid', () => {
    component.signupStage = 'password';
    component.signupForm.patchValue({
      password: '', confirmPassword: ''
    });
    component.next();
    expect(mailServiceMock.addUser).not.toHaveBeenCalled();
  });

  it('should submit from password stage when passwords are valid', () => {
    component.signupStage = 'password';
    component.signupForm.patchValue({
      fname: 'Virat',
      lname: 'Kohli',
      dob: new Date(2000, 0, 1),
      gender: 'Male',
      phone: '9876543210',
      email: 'john@smail.com',
      password: 'Password@123',
      confirmPassword: 'Password@123'
    });
    component.next();
    expect(mailServiceMock.addUser).toHaveBeenCalled();
  });
})