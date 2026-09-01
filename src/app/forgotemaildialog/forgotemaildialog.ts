import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MailService } from '../mail-service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-forgotemaildialog',
  imports: [MatIconModule, MatButtonModule, MatInputModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatSnackBarModule],
  templateUrl: './forgotemaildialog.html',
  styleUrl: './forgotemaildialog.scss',
})
export class Forgotemaildialog {

  fb = inject(FormBuilder);
  mailService = inject(MailService);
  snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<Forgotemaildialog>);

  emailFound: boolean = false;
  recoveredEmail = '';

  forgotEmailForm: FormGroup;

  constructor() {
    this.forgotEmailForm = this.fb.group({
      phone: ['',
        [Validators.required, Validators.pattern(/^[0-9]{10}$/)]
      ],
    });
  }

  // finds email
  findEmail(): void {
    const phonecontrol = this.forgotEmailForm.get('phone');

    if (phonecontrol?.invalid) {
      phonecontrol?.markAsTouched();
      return;
    }

    const phone = phonecontrol?.value;
    this.mailService.getUserByPhone(phone).subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.emailFound = false;
          this.snackBar.open('No account found with this phone number', 'Close', {
            duration: 3000
          });
          return;
        }

        const user = users[0];
        this.recoveredEmail = user.email;
        this.emailFound = true;
      },
      error: (error) => {
        console.error('Error finding email', error);
        this.snackBar.open('Unable to find your email', 'Close', {
          duration: 3000
        });
      }
    })
  }

  // close dialog
  close(): void {
    this.dialogRef.close();
  }
}
