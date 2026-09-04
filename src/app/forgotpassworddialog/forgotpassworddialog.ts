import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MailService } from '../mail-service';

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
  mailService = inject(MailService);

  submitted: boolean = false;

  hideOldPassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;

  private dialogRef = inject(MatDialogRef<Forgotpassworddialog>);

  private dialogData = inject(MAT_DIALOG_DATA) as { email: string };

  forgotPasswordForm = this.fb.group(
    {
      email: [this.dialogData?.email || '', [Validators.required, Validators.email]],

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

    const email = this.forgotPasswordForm.value.email?.trim().toLowerCase();
    const newPassword = this.forgotPasswordForm.value.password;

    if (!email || !newPassword) {
      return;
    }

    this.mailService.getUserByEmail(email).subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.snackbar.open('Email not found', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return;
        }

        const user = users[0];

        this.mailService.updateUser(user.id!, {
          password: newPassword
        }).subscribe({
          next: (updatedUser) => {
            this.snackbar.open('Password reset successful', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error updating password:', error);
            this.snackbar.open('Unable to reset password', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        })
      },
      error: (error) => {
        console.error('Error finding user:', error);
        this.snackbar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}