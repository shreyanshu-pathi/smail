import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { MailService } from '../mail-service';
import { Forgotemaildialog } from '../forgotemaildialog/forgotemaildialog';
import { Forgotpassworddialog } from '../forgotpassworddialog/forgotpassworddialog';
import { MatDialog } from '@angular/material/dialog';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  fb = inject(FormBuilder);
  mailService = inject(MailService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog)

  loginForm: FormGroup;

  loginStage: 'email' | 'password' = 'email';

  currentUser: any = null;

  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
      ]],

      password: ['', [
        Validators.required
      ]]
    });
  }

  // stays logged in 
  ngOnInit() {
    const loggedInUser = this.mailService.getCurrentUser();

    if (loggedInUser) {
      this.router.navigate(['/inbox'], {
        replaceUrl: true
      });
    }
  }

  // checks email
  next(): void {
    const emailControl = this.loginForm.get('email');

    if (emailControl?.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    let username = emailControl?.value.trim();

    // Remove @smail.com if user already typed it
    username = username.replace(/@smail\.com$/i, '');

    // create complete email
    const email = `${username}@smail.com`;

    emailControl?.setValue(email);

    this.mailService.getUserByEmail(email).subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.snackBar.open('Account not found', 'Close',
            {
              duration: 3000
            }
          );
          return;
        }

        // User exists
        this.currentUser = users[0];

        // moves to password
        this.loginStage = 'password';
      },

      error: (error) => {
        console.error('Error checking email:', error);

        this.snackBar.open('Something went wrong', 'Close',
          {
            duration: 3000
          }
        );
      }
    });
  }

  //login
  login(): void {
    const passwordControl = this.loginForm.get('password');

    if (passwordControl?.invalid) {
      passwordControl?.markAsTouched();
      return;
    }

    const password = passwordControl?.value;
    if (!this.currentUser) {
      return;
    }

    let isPasswordCorrect = false;

    if (
      this.currentUser.password.startsWith('$2a$') ||
      this.currentUser.password.startsWith('$2b$') ||
      this.currentUser.password.startsWith('$2y$')
    ) {
      isPasswordCorrect = bcrypt.compareSync(
        password,
        this.currentUser.password
      );
    } else {
      // Existing users with existing passwords
      isPasswordCorrect = password === this.currentUser.password;
    }

    if (!isPasswordCorrect) {
      this.snackBar.open('Incorrect password', 'Close', {
        duration: 3000
      });
      return;
    }

    // Store current logged-in user
    this.mailService.setCurrentUser(this.currentUser);

    // Navigate to inbox
    this.router.navigate(['/inbox'],
      { replaceUrl: true }
    );
  }

  // back to email
  backToEmail(): void {
    this.loginStage = 'email';
    this.loginForm.get('password')?.reset();
  }

  // forgot email
  onForgotEmail(): void {
    this.dialog.open(Forgotemaildialog, {
      width: '600px',
      // maxWidth: '95vw'
    });
  }

  // forgot password
  onForgotPassword(): void {
    this.dialog.open(Forgotpassworddialog, {
      width: '450px',
      maxWidth: '95vw'
    });
  }
}