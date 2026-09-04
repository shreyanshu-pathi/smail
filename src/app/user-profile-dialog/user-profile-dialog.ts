import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MailService } from '../mail-service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-user-profile-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSnackBarModule,
    DatePipe,
    MatIconModule, MatRadioModule
  ],
  templateUrl: './user-profile-dialog.html',
  styleUrl: './user-profile-dialog.scss',
})
export class UserProfileDialog {

  emailUsername: string = '';
  emailEditing: boolean = false;
  canChangeEmail: boolean = false;

  nextEmailChangeDate: Date | null = null;
  timeRemaining: string = '01:00:00';

  private timer: any;
  private originalEmail: string = '';

  // password change
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // hide passwords of all passwords fields
  hideCurrentPassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;

  passwordSubmitted: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<UserProfileDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private mailService: MailService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.originalEmail = this.data.email;

    // dob format
    this.data.dob = this.formatDobForInput(this.data.dob);

    // email ending with @smail.com
    this.emailUsername = this.data.email ? this.data.email.replace(/@smail\.com$/i, '') : '';

    // password fields to be empty
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    this.checkEmailChangeStatus();
  }

  // Profile picture
  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image', 'Close', {
        duration: 3000
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.data.profileImage = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  // remove picture
  removeProfilePicture() {
    this.data.profileImage = null;
  }

  // DOB
  private formatDobForInput(dob: string | Date | null | undefined): string {
    if (!dob) {
      return '';
    }

    const date = new Date(dob);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  }

  // change of username only
  onEmailUsernameChange() {
    this.emailUsername = this.emailUsername.replace(/\s/g, '').replace(/@.*$/, '');
    this.data.email = `${this.emailUsername}@smail.com`
  }

  // check existing email window
  checkEmailChangeStatus(): void {

    const now = Date.now();

    // check if an email change window is currently active
    if (this.data.emailChangeExpiresAt) {
      const expiresAt = new Date(this.data.emailChangeExpiresAt).getTime();

      const startedAt = this.data.emailChangeStartedAt
        ? new Date(this.data.emailChangeStartedAt).getTime()
        : 0;

      // Active 1-hour window
      if (startedAt && now < expiresAt) {
        this.emailEditing = true;
        this.canChangeEmail = true;

        this.emailUsername = this.data.email ? this.data.email.replace(/@smail\.com$/i, '') : '';

        this.startTimer(expiresAt);
        return;
      }

      // Window expired
      this.emailEditing = false;

      this.data.emailChangeStartedAt = null;
      this.data.emailChangeExpiresAt = null;
    }

    // checks 6-month rvalidation(restrict)
    if (this.data.emailLastChangedAt) {
      const lastChanged = new Date(this.data.emailLastChangedAt);

      const nextChange = new Date(lastChanged);

      nextChange.setMonth(nextChange.getMonth() + 6);

      this.nextEmailChangeDate = nextChange;

      // Still inside 6-month restriction
      if (now < nextChange.getTime()) {

        this.canChangeEmail = false;
        this.emailEditing = false;

        this.stopTimer();
        return;
      }
    }

    // user has never changed email OR 6 months passed
    this.canChangeEmail = true;
    this.emailEditing = false;
  }

  // start email change for 1 hour
  startEmailChange(emailInput: HTMLInputElement): void {
    if (!this.canChangeEmail) {
      this.snackBar.open('You cannot change your email yet', 'Close', {
        duration: 3000
      });
      return;
    }

    const currentUser = this.mailService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.mailService.startEmailChangeWindow(currentUser).subscribe({
      next: (updatedUser) => {
        this.mailService.currentUser = updatedUser;
        localStorage.setItem('smailCurrentUser', JSON.stringify(updatedUser));
        this.data.emailChangeStartedAt = updatedUser.emailChangeStartedAt;
        this.data.emailChangeExpiresAt = updatedUser.emailChangeExpiresAt;
        this.emailEditing = true;
        this.canChangeEmail = true;

        this.emailUsername = updatedUser.email.replace(/@smail\.com$/i, '');

        const expiresAt = new Date(updatedUser.emailChangeExpiresAt!).getTime();

        this.startTimer(expiresAt);
        this.snackBar.open('You have 1 hour to change your email', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error starting email change', error);

        this.emailEditing = false;
        this.canChangeEmail = false;
        emailInput.disabled = true;

        this.snackBar.open(error.message || 'Unable to change email', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // timer
  startTimer(expiresAt: number): void {
    this.stopTimer();
    this.updateTimer(expiresAt);
    this.timer = setInterval(() => {
      this.updateTimer(expiresAt);
    }, 1000);
  }

  // updates timmmer  
  updateTimer(expiresAt: number): void {
    const remaining = expiresAt - Date.now();

    if (remaining <= 0) {
      this.timeRemaining = '00:00:00';
      this.emailEditing = false;
      this.stopTimer();

      this.mailService.clearEmailChangeWindow(this.data.id).subscribe();
      this.data.emailChangeStartedAt = null;
      this.data.emailChangeExpiresAt = null;
      this.snackBar.open('Your email timer has expired', 'Close', {
        duration: 3000
      });
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    this.timeRemaining = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }


  pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  // stop timer
  stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // close profile
  close(): void {
    this.stopTimer();
    this.dialogRef.close();
  }

  // save profile
  save(): void {
    // console.log('save', 1)
    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      this.snackBar.open('User profile is unavailable', 'Close', {
        duration: 3000
      });
      return;
    }

    // profile validation 
    // name validation
    if (!this.data.name?.trim()) {
      this.snackBar.open('Name cannot be empty.', 'Close', {
        duration: 3000
      });
      return;
    }

    // phone validation
    if (!this.data.phone?.trim()) {
      this.snackBar.open('Phone cannot be empty.', 'Close', {
        duration: 3000
      });
      return;
    }

    if (this.data.phone && !/^\d{10}$/.test(this.data.phone)) {
      this.snackBar.open('Phone number must contain exactly 10 digits.', 'Close', {
        duration: 3000
      });
      return;
    }

    // email validation
    const username = this.emailUsername.trim();

    if (!username) {
      this.snackBar.open('Email username cannot be empty', 'Close', {
        duration: 3000
      });
      return;
    }

    const usernamePattern = /^[a-zA-Z0-9._-]+$/;
    if (!usernamePattern.test(username)) {
      this.snackBar.open('Email can contain only letters, numbers, dots, underscores and hyphens.', 'Close', {
        duration: 3000
      });
      return;
    }

    const newEmail = `${username}@smail.com`;
    const emailChanged = newEmail.toLowerCase() !== this.originalEmail.toLowerCase();

    // email change validation
    if (emailChanged) {

      // edit email
      if (!this.emailEditing) {
        this.snackBar.open('Click "Change Email" before changing your email.', 'Close', {
          duration: 3000
        });
        return;
      }

      const expiresAt = this.data.emailChangeExpiresAt;

      // Check email timer
      if (!expiresAt || Date.now() > new Date(expiresAt).getTime()) {
        this.snackBar.open('Your 1-hour email change window has expired.', 'Close', {
          duration: 3000
        });
        this.emailEditing = false;
        return;
      }
    }

    // password change
    const passwordChangeRequested = 
      this.currentPassword.trim() !== '' ||
      this.newPassword.trim() !== '' ||
      this.confirmPassword.trim() !== '';

      this.passwordSubmitted = passwordChangeRequested;

    if (passwordChangeRequested) {
      // this.passwordSubmitted = true;

      if (!this.currentPassword) {
        this.snackBar.open('Current password is required', 'Close', {
          duration: 3000
        });
        return;
      }

      // check current user password
      if (this.currentPassword !== currentUser.password) {
        this.snackBar.open('Current password is incorrect', 'Close', {
          duration: 3000
        });
        return;
      }

      // new password
      if (!this.newPassword) {
        this.snackBar.open('New password is required', 'Close', {
          duration: 3000
        });
        return;
      }

      // new passwords validation
      if (!this.isPasswordValid()) {
        this.snackBar.open('Password must contain at least 6 characters, uppercase, lowercase, number and special character.', 'Close', {
          duration: 3000
        });
        return;
      }

      // new password should not be as old password
      if (this.currentPassword === this.newPassword) {
        this.snackBar.open('New password cannnot be same as old password', 'Close', {
          duration: 3000
        });
        return;
      }

      // confirm password
      if (!this.confirmPassword) {
        this.snackBar.open('Please confirm your new password', 'Close', {
          duration: 3000
        });
        return;
      }

      // new password should confirm password
      if (this.newPassword !== this.confirmPassword) {
        this.snackBar.open('Passwords do no match', 'Close', {
          duration: 3000
        });
        return;
      }
    }

    // create updated user
    const nameParts = this.data.name.trim().split(/\s+/);
    const fname = nameParts[0] || currentUser.fname;
    const lname = nameParts.slice(1).join(' ') || '';

    const updatedData: any = {
      fname: fname,
      lname: lname,
      dob: this.data.dob ? new Date(`${this.data.dob}T00:00:00`).toISOString() : null,
      gender: this.data.gender,
      phone: this.data.phone,
      email: newEmail,
      profileImage: this.data.profileImage ?? null
    };

    // add new password
    if (passwordChangeRequested) {
      updatedData.password = this.newPassword;
    }

    // email changed successfully
    if (emailChanged) {
      const oldEmail = currentUser.email;
      const existingAliases = currentUser.emailAliases || [];
      const aliases = [...existingAliases];

      if (oldEmail && oldEmail.toLowerCase() !== newEmail.toLowerCase() &&
        !aliases.some((alias: string) => alias.toLowerCase() === oldEmail.toLowerCase())) {

        aliases.push(oldEmail);
      }

      updatedData.emailAliases = aliases;
      updatedData.emailChangeStartedAt = null;
      updatedData.emailChangeStartedAt = null;
      updatedData.emailLastChangedAt = new Date().toISOString();

      this.mailService.updateUserEmail(currentUser, updatedData).subscribe({
        next: (updatedUser) => {
          this.handleSuccessfulSave(updatedUser);
        },
        error: (error) => {
          console.error('Unable to update email:', error);
          this.snackBar.open('Unable to update email.', 'Close', {
            duration: 3000
          });
        }
      });
      return;
    }

    // save button
    this.mailService.updateUser(currentUser.id!, updatedData).subscribe({
      next: (updatedUser) => {
        this.handleSuccessfulSave(updatedUser);
      },
      error: (error) => {
        console.error('Unable to update profile', error);
        this.snackBar.open('unable to update profile', 'Close', {
          duration: 3000
        });
      }
    });
  };

  // Handles all the fields by saving it 
  private handleSuccessfulSave(updatedUser: any): void {
    // Update service
    this.mailService.currentUser = updatedUser;

    localStorage.setItem('smailCurrentUser', JSON.stringify(updatedUser));

    this.data.name = `${updatedUser.fname} ${updatedUser.lname}`.trim();
    this.data.dob = this.formatDobForInput(updatedUser.dob);
    this.data.gender = updatedUser.gender;
    this.data.phone = updatedUser.phone;
    this.data.email = updatedUser.email;
    this.data.profileImage = updatedUser.profileImage ?? null;
    this.data.emailAliases = updatedUser.emailAliases ?? [];
    this.data.emailLastChangedAt = updatedUser.emailLastChangedAt;
    this.data.emailChangeStartedAt = updatedUser.emailChangeStartedAt;
    this.data.emailChangeExpiresAt = updatedUser.emailChangeExpiresAt;
    this.emailUsername = updatedUser.email ? updatedUser.email.replace(/@smail\.com$/i, '') : '';

    this.originalEmail = updatedUser.email;
    this.emailEditing = false;

    this.stopTimer();

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    this.passwordSubmitted = false;
    this.snackBar.open('Profile updated successfully', 'Close', {
      duration: 3000
    });

    this.dialogRef.close(updatedUser);
  }

  // password validation
  isPasswordValid(): boolean {
    if (!this.newPassword) {
      return false;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
    return (this.newPassword.length >= 6 && passwordPattern.test(this.newPassword));
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}