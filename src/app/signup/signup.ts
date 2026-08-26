import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { User } from '../model';
import { MailService } from '../mail-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatRadioModule, MatSnackBarModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  fb = inject(FormBuilder);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  mailService = inject(MailService);

  signupStage: 'name' | 'dob' | 'gender' | 'phone' | 'email' | 'password' | 'confirmPassword' = 'name'

  hide = signal(true);
  hideConfirmPassword = signal(true);

  emailSuggestions: string[] = [];

  emailSuggestionSelected = false;

  signupForm: FormGroup;

  constructor() {

    this.signupForm = this.fb.group({

      fname: new FormControl('', [Validators.required, Validators.minLength(3),
      Validators.pattern('^[a-zA-Z ]+$')
      ]),

      lname: new FormControl('', [Validators.required, Validators.minLength(2),
      Validators.pattern('^[a-zA-Z ]+$')]),

      email: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]),

      phone: new FormControl('', [Validators.pattern('^[0-9]{10}$')]),

      dob: new FormControl<Date | null>(null, [Validators.required]),

      gender: new FormControl('', [Validators.required]),

      password: new FormControl('', [Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
      Validators.minLength(8)]),

      confirmPassword: new FormControl('', [
        Validators.required
      ])
    },
      {
        validators: this.passwordMatchValidator
      }
    );
  }

  // Matching password validation
  passwordMatchValidator(
    form: AbstractControl
  ): ValidationErrors | null {

    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    if (password !== confirmPassword) {
      return {
        passwordMismatch: true
      };
    }
    return null;
  }

  // Next button
  next(): void {

    if (this.signupStage === 'name') {
      const fname = this.signupForm.controls['fname'];
      const lname = this.signupForm.controls['lname'];

      if (fname.invalid || lname.invalid) {
        fname.markAsTouched();
        lname.markAsTouched();
        return;
      }
      this.signupStage = 'dob'
    }

    else if (this.signupStage === 'dob') {
      const dob = this.signupForm.controls['dob'];

      if (dob.invalid) {
        dob.markAsTouched();
        return;
      }
      this.signupStage = 'gender'
    }

    else if (this.signupStage === 'gender') {
      const gender = this.signupForm.controls['gender'];

      if (gender.invalid) {
        gender.markAsTouched();
        return;
      }
      this.signupStage = 'phone'
    }

    else if (this.signupStage === 'phone') {
      const phone = this.signupForm.controls['phone'];

      if (phone.invalid) {
        phone.markAsTouched();
        return;
      }
      this.signupStage = 'email'
    }

    else if (this.signupStage === 'email') {
      const emailControl = this.signupForm.controls['email'];

      if (emailControl.invalid) {
        emailControl.markAsTouched();
        return;
      }

      // default @smail.com
      let username = emailControl.value.trim().toLowerCase();

      // removes the smail if user types
      username = username.replace(/@smail\.com$/i, '');

      // username not be empty
      if (!username) {
        emailControl.markAsTouched();
        return;
      }

      //  creates @smail.com
      const mainEmail = `${username}@smail.com`;

      // checks whether user chose from the suggestions
      if (this.emailSuggestionSelected) {
        emailControl.setValue(mainEmail);

        this.emailSuggestions = [];

        this.signupStage = 'password';
        return;
      }

      //  checks if email already exists
      this.mailService.getUserByEmail(mainEmail).subscribe({

        next: (users) => {

          // generate mails whther user exists or  not
          this.generateEmailSuggestions(username);

          if (users.length > 0) {
            this.snackBar.open('Email already exists. Please choose another email', 'Close', {
              duration: 3000
            });

            return;
          }
          // email is available
          emailControl.setValue(mainEmail);

          this.emailSuggestions = [];

          this.signupStage = 'password';
        },
        error: (error) => {
          this.snackBar.open('Unable to check email availability', 'Close', {
            duration: 3000
          });
        }
      });

    }

    else if (this.signupStage === 'password') {
      const password = this.signupForm.controls['password'];
      const confirmPassword = this.signupForm.controls['confirmPassword'];

      if (password.invalid || confirmPassword.invalid) {
        password.markAsTouched();
        confirmPassword.markAsTouched();
        return;
      }
      this.submitForm();
    }
  }

  // Email Suggestions
  generateEmailSuggestions(username: string): void {

    const suggestions = [
      `${username}123@smail.com`,
      `${username}${new Date().getFullYear()}@smail.com`,
      `${username}.dev@smail.com`,
      `${username}01@smail.com`
    ];

    this.emailSuggestions = [];

    suggestions.forEach(email => {
      this.mailService.getUserByEmail(email).subscribe({
        next: (users) => {
          if (users.length === 0) {
            this.emailSuggestions.push(email);
          }
        },
        error: (error) => {
          console.error('Email already take, try a new one', error);
        }
      });
    });
  }

  // select from suggestions
  selectSuggestion(email: string): void {
    this.signupForm.controls['email'].setValue(email);
    this.emailSuggestionSelected = true;
    this.emailSuggestions = [];
    this.signupStage = 'password';
  }

  onEmailChange(): void {
    this.emailSuggestionSelected = false;
  }

  // Back button
  back(): void {
    if (this.signupStage === 'dob') {
      this.signupStage = 'name'
    }

    else if (this.signupStage === 'gender') {
      this.signupStage = 'dob';
    }

    else if (this.signupStage === 'phone') {
      this.signupStage = 'gender';
    }

    else if (this.signupStage === 'email') {
      this.signupStage = 'phone';
    }

    else if (this.signupStage === 'password') {
      this.signupStage = 'email';
    }
  }

  // submit form
  submitForm(): void {

    const password = this.signupForm.controls['password'];
    const confirmPassword = this.signupForm.controls['confirmPassword'];

    // Validate password fields first
    if (password.invalid || confirmPassword.invalid) {
      password.markAsTouched();
      confirmPassword.markAsTouched();
      return;
    }

    // Check password mismatch
    if (this.signupForm.hasError('passwordMismatch')) {
      confirmPassword.markAsTouched();
      return;
    }

    const formValue = this.signupForm.value;

    const user: User = {
      fname: formValue.fname,
      lname: formValue.lname,
      email: formValue.email,
      phone: formValue.phone,
      dob: formValue.dob,
      gender: formValue.gender,
      password: formValue.password
    };

    // Check if email already exists
    this.mailService.getUserByEmail(user.email).subscribe({

      next: (users) => {

        if (users.length > 0) {

          this.snackBar.open('Email already registered', 'Close',
            {
              duration: 3000
            }
          );
          return;
        }

        // Create account only after all validation passes
        this.mailService.addUser(user).subscribe({

          next: () => {

            this.snackBar.open(
              'Registration successful',
              'Close',
              {
                duration: 3000
              }
            );

            this.mailService.setCurrentUser(user);

            this.router.navigate(['/inbox']);
          },

          error: (error) => {

            console.error('Error creating user', error);

            this.snackBar.open(
              'Unable to create account',
              'Close',
              {
                duration: 3000
              }
            );
          }

        });

      },

      error: (error) => {

        console.error('Error checking email', error);

        this.snackBar.open(
          'Unable to check email availability',
          'Close',
          {
            duration: 3000
          }
        );
      }

    });
  }
}