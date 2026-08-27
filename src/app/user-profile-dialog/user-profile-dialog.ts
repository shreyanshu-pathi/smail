// import { Component, Inject } from '@angular/core';
// import { MatButtonModule } from '@angular/material/button';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { FormsModule } from "@angular/forms";
// import { DatePipe } from '@angular/common';
// import { MailService } from '../mail-service';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// @Component({
//   selector: 'app-user-profile-dialog',
//   imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
//     FormsModule, DatePipe, MatSnackBarModule],
//   templateUrl: './user-profile-dialog.html',
//   styleUrl: './user-profile-dialog.scss',
// })
// export class UserProfileDialog {
//   emailEditing: boolean = false;
//   emailChangeCount = 0;
//   timeRemaining = '01:00:00';
//   private timer: any;
//   private originalEmail = '';

//   constructor(
//     public dialogRef: MatDialogRef<UserProfileDialog>,
//     @Inject(MAT_DIALOG_DATA)
//     public data: any,
//     private mailService: MailService,
//     private snackBar: MatSnackBar
//   ) { }

//   ngOnInit(): void {
//     this.originalEmail = this.data.email;
//     this.emailChangeCount = this.data.emailChangeCount ?? 0;
//     this.checkExistingEmail();
//   }

//   // check for existing email window
//   checkExistingEmail(): void {
//     if (!this.data.emailChangeExpiresAt) {
//       return;
//     }

//     const expiresAt = new Date(this.data.emailChangeExpiresAt).getTime();
//     const now = Date.now();
//     if (now < expiresAt) {
//       this.emailEditing = true;
//       this.startTimer(expiresAt);
//     }
//   }

//   // changing email
//   startEmailChange(): void {
//     if (this.emailChangeCount >= 2) {
//       this.snackBar.open('You can change your email only twice a year.', 'Close', {
//         duration: 3000
//       });
//       return;
//     }

//     const currentuser = this.mailService.getCurrentUser();
//     if (!currentuser) {
//       return;
//     }

//     this.mailService.startEmailChangeWindow(currentuser).subscribe({
//       next: (updatedUser) => {
//         this.data.emailChangeStartedAt = updatedUser.emailChangeStartedAt;
//         this.data.emailChangeExpiresAt = updatedUser.emailChangeExpiresAt;

//         this.emailEditing = true;

//         const expiresAt = new Date(updatedUser.emailChangeExpiresAt!).getTime();
//         this.startTimer(expiresAt);

//         this.snackBar.open('You have 1 hour to change your email', 'Close', {
//           duration: 3000
//         });
//       },
//       error: (error) => {
//         console.error('', error);
//         this.snackBar.open(error.message || 'Unable to change email', 'Close', {
//           duration: 3000
//         });
//       }
//     });
//   }

//   //  start timer
//   startTimer(expiresAt: number): void {
//     this.stopTimer();
//     this.updateTimer(expiresAt);
//     this.timer = setInterval(() => {
//       this.updateTimer(expiresAt);
//     }, 1000);
//   }

//   // will update the timer if it ix expiring
//   updateTimer(expiresAt: number) {
//     const remaining = expiresAt - Date.now();

//     if (remaining <= 0) {
//       this.timeRemaining = '00:00:00';
//       this.emailEditing = false;

//       this.stopTimer();
//       this.snackBar.open('Your email timer has expired', 'Close', {
//         duration: 3000
//       });
//       return;
//     }

//     const hours = Math.floor(remaining / (1000 * 60 * 60));
//     const minutes = Math.floor(remaining % (1000 * 60 * 60)) / (1000 * 60);
//     const seconds = Math.floor(remaining % (1000 * 60)) / 1000;

//     this.timeRemaining =
//       `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
//   }

//   pad(value: number): string {
//     return value.toString().padStart(2, '0')
//   }

//   // will stop the timer 
//   stopTimer(): void {
//     if (this.timer) {
//       clearInterval(this.timer);
//       this.timer = null;
//     }
//   }


//   // close profile
//   close(): void {
//     this.stopTimer();
//     this.dialogRef.close()
//   }

//   // save profile
//   save(): void {
//     // if email is not changed
//     if (this.data.email === this.originalEmail) {
//       this.stopTimer();
//       this.dialogRef.close(this.data);
//       return;
//     }


//     // Email was changed but editing wasn't enabled
//     if (!this.emailEditing) {
//       this.snackBar.open('Click "Change Email" before changing your email.', 'Close',
//         {
//           duration: 3000
//         }
//       );
//       return;
//     }

//     // Check empty email
//     if (!this.data.email?.trim()) {
//       this.snackBar.open('Email cannot be empty.', 'Close',
//         {
//           duration: 3000
//         }
//       );
//       return;
//     }

//     // Check email format
//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailPattern.test(this.data.email)) {
//       this.snackBar.open('Please enter a valid email address.', 'Close',
//         {
//           duration: 3000
//         }
//       );
//       return;
//     }

//     const currentUser = this.mailService.getCurrentUser();
//     if (!currentUser) {
//       return;
//     }

//     // Check whether one-hour window expired
//     if (!currentUser.emailChangeExpiresAt || Date.now() > new Date(currentUser.emailChangeExpiresAt).getTime()) {
//       this.snackBar.open('Your 1-hour email change window has expired.', 'Close',
//         {
//           duration: 3000
//         }
//       );

//       this.emailEditing = false;
//       return;
//     }

//     this.mailService.changeEmail(currentUser, this.data.email.trim()).subscribe({
//       next: (updatedUser) => {
//         this.stopTimer();
//         this.emailChangeCount = updatedUser.emailChangeCount ?? 0;
//         this.data.email = updatedUser.email;
//         this.data.emailChangeCount = updatedUser.emailChangeCount;
//         this.data.emailChangeYear = updatedUser.emailChangeYear;
//         this.data.emailChangeStartedAt = null;
//         this.data.emailChangeExpiresAt = null;

//         this.snackBar.open('Email updated successfully.', 'Close',
//           {
//             duration: 3000
//           }
//         );
//         this.dialogRef.close(this.data);
//       },
//       error: (error) => {
//         this.snackBar.open(error.message || 'Unable to update email.', 'Close',
//           {
//             duration: 3000
//           }
//         );
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     this.stopTimer();
//   }
// }

import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MailService } from '../mail-service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-profile-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './user-profile-dialog.html',
  styleUrl: './user-profile-dialog.scss',
})
export class UserProfileDialog {

  emailEditing = false;
  canChangeEmail = false;
  nextEmailChangeDate: Date | null = null;
  timeRemaining = '01:00:00';
  private timer: any;
  private originalEmail = '';

  constructor(
    public dialogRef: MatDialogRef<UserProfileDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private mailService: MailService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.originalEmail = this.data.email;
    this.checkEmailChangeStatus();
  }

  // check existing email window
  checkEmailChangeStatus(): void {
    // if the user has never changed email, it lets you change
    if (!this.data.emailLastChangedAt) {
      this.canChangeEmail = true;
      return;
    }

    const lastChanged = new Date(this.data.emailLastChangedAt);

    // calculate 6 months from last successful change
    const nextChange = new Date(lastChanged);
    nextChange.setMonth(nextChange.getMonth() + 6);

    this.nextEmailChangeDate = nextChange;

    const now = Date.now();
    const nextChangeTime = nextChange.getTime();

    // 6 months completed
    if (now >= nextChangeTime) {
      this.canChangeEmail = true;
    } else {
      this.canChangeEmail = false;
    }

    // check if there is 1 hour active window
    this.checkExistingEmailWindow();
  }

  // within the 1 hour of time the dialog can be closed and opened which would still remain active
  checkExistingEmailWindow() {
    if (!this.data.emailChangeExpiresAt) {
      return;
    }

    const expiresAt = new Date(this.data.emailChangeExpiresAt).getTime();

    const now = Date.now();

    if (now < expiresAt) {
      this.emailEditing = true;
      this.canChangeEmail = true;
      this.startTimer(expiresAt);
    }
    else {
      this.emailEditing = false;
      this.data.emailChangeStartedAt = null;
      this.data.emailChangeExpiresAt = null;
    }
  }

  // start email change for 1 hour
  startEmailChange(): void {
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

        const expiresAt = new Date(updatedUser.emailChangeExpiresAt!).getTime();

        this.startTimer(expiresAt);
        this.snackBar.open('You have 1 hour to change your email', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error starting email change', error);
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
    const currentUser = this.mailService.getCurrentUser();
    if (!currentUser) {
      this.snackBar.open(
        'User profile is unavailable', 'Close',
        {
          duration: 3000
        }
      );
      return;
    }

    // profile validation 
    if (!this.data.name?.trim()) {
      this.snackBar.open('Name cannot be empty.', 'Close', {
        duration: 3000
      });
      return;
    }

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
    const emailChanged = this.data.email.trim() !== this.originalEmail;

    if (emailChanged) {

      // User changed email without clicking
      // Change Email
      if (!this.emailEditing) {
        this.snackBar.open('Click "Change Email" before changing your email.', 'Close', {
          duration: 3000
        });
        return;
      }

      // Empty email
      if (!this.data.email?.trim()) {
        this.snackBar.open('Email cannot be empty.', 'Close', {
          duration: 3000
        });
        return;
      }

      // Email valiadation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(this.data.email.trim())) {
        this.snackBar.open('Please enter a valid email address.', 'Close', {
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

    // create updated user
    const nameParts = this.data.name.trim().split(/\s+/);
    const fname = nameParts[0] || currentUser.fname;
    const lname = nameParts.slice(1).join(' ') || '';

    const updatedData: any = {
      fname: fname,
      lname: lname,
      dob: this.data.dob,
      gender: this.data.gender,
      phone: this.data.phone,
      email: this.data.email.trim()
    }

    //  email changed successfully
    if (emailChanged) {
      updatedData.emailLastChangedAt = new Date().toISOString();
      updatedData.emailChangeStartedAt = null;
      updatedData.emailChangeExpiresAt = null;
    }

    // update to db.json
    this.mailService.updateUser(currentUser.id!, updatedData).subscribe({
      next: (updatedUser) => {

        // Update service current user
        this.mailService.currentUser = updatedUser;

        // Update localStorage
        localStorage.setItem('smailCurrentUser', JSON.stringify(updatedUser));

        // Stop email timer
        this.stopTimer();

        // reset email
        this.emailEditing = false;

        // updates original email
        this.originalEmail = updatedUser.email;

        // Update local dialog data
        this.data.name = `${updatedUser.fname} ${updatedUser.lname}`.trim();
        this.data.dob = updatedUser.dob;
        this.data.gender = updatedUser.gender;
        this.data.phone = updatedUser.phone;
        this.data.email = updatedUser.email;
        this.data.emailLastChangedAt = updatedUser.emailLastChangedAt;
        this.data.emailChangeStartedAt = updatedUser.emailChangeStartedAt;
        this.data.emailChangeExpiresAt = updatedUser.emailChangeExpiresAt;

        this.checkEmailChangeStatus();
        
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000
        });

        // Return updated user to Inbox
        this.dialogRef.close(updatedUser);
      },
      error: (error) => {
        console.error('Unable to update profile:', error);
        this.snackBar.open('Unable to update profile.', 'Close',
          {
            duration: 3000
          }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}