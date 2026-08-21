import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

// Password Matching Validator
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-forgotpassworddialog',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatSnackBarModule,
    MatDialogModule, MatIconModule],
  templateUrl: './forgotpassworddialog.html',
  styleUrl: './forgotpassworddialog.scss',
})
export class Forgotpassworddialog {
  private fb = inject(FormBuilder);
  snackbar = inject(MatSnackBar);

  submitted: boolean = false;

  private dialogRef = inject(MatDialogRef<Forgotpassworddialog>);

  forgotPasswordForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$'
          ),
        ],
      ],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordMatchValidator,
    }
  );

  onResetPassword(): void {
    this.submitted = true;
    if (this.forgotPasswordForm.invalid) {
      return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const userIndex = users.findIndex(
      (user: any) => user.email === this.forgotPasswordForm.value.email,
    );

    if (userIndex !== -1) {
      users[userIndex].password = this.forgotPasswordForm.value.password;
      localStorage.setItem('users', JSON.stringify(users));

      this.snackbar.open('Password reset successful', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbbar'],
      });

      this.dialogRef.close();
    } else {
      this.snackbar.open('Email not found', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }
}
