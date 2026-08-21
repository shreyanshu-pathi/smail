import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ComposeDialog } from '../compose-dialog/compose-dialog';
import { MailService } from '../mail-service';
import { Mail } from '../model';
import { DatePipe } from '@angular/common';
import { UserProfileDialog } from '../user-profile-dialog/user-profile-dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { email } from '@angular/forms/signals';

@Component({
  selector: 'app-inbox',
  imports: [MatButtonModule, MatTooltipModule, MatIconModule, RouterLink, MatFormFieldModule,
    MatCheckboxModule, MatPaginatorModule, MatMenuModule, FormsModule, DatePipe, MatSnackBarModule],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class Inbox {

  router = inject(Router);
  dialog = inject(MatDialog);
  mailService = inject(MailService);
  snackBar = inject(MatSnackBar);

  // search mails
  searchText = '';

  // contains mails currently displayed
  mails: Mail[] = [];

  // contains all mails
  allMails: Mail[] = [];

  filteredMails: Mail[] = [];

  // Selected mail
  selectedMail: Mail | null = null;

  ngOnInit(): void {
    this.loadInboxMails();
  }

  // Inbox mails
  loadInboxMails(): void {
    const currentUser = this.mailService.getCurrentUser();
    if (!currentUser) {
      console.log('No user found');
      return;
    }

    this.mailService.getInboxMails(currentUser.email).subscribe({
      next: (mails) => {
        this.addMailsToBeginning(mails);
      },
      error: (error) => {
        console.error('Error loading inbox:', error);
      }
    });
  }

  // compose mail
  compose(): void {
    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      console.error('No logged-in user found');
      return;
    }

    const dialogRef = this.dialog.open(ComposeDialog, {
      width: '550px',
      maxWidth: '95vw',
      position: {
        bottom: '20px',
        right: '40px'
      },
      data: {
        from: this.mailService.currentUser?.email ?? ''
      },
      panelClass: 'compose-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        return;
      }
      this.sendMultipleUsers(email);
    })
  }

  // Sending email to multiple users
  sendMultipleUsers(mailData: any): void {

    if (!mailData || mailData.to) {
      this.snackBar.open('Please enter atleast one recipient', 'Close', { duration: 3000 });
      return;
    }
    const recipients = mailData.to.split(',').map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    if (recipients.length === 0) {
      this.snackBar.open('Please enter atleast one recipient', 'Close', { duration: 3000 });
      return;
    }

    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    // sending mail to each recipient
    recipients.forEach((recipient: string) => {
      const mail: Mail = {
        from: currentUser.email,
        to: recipient,
        subject: mailData.subject,
        body: mailData.body,
        date: new Date().toISOString(),
        read: false,
        starred: false,
        trash: false
      };

      this.mailService.sendMail(mail).subscribe({
        next: () => {
          console.log(`Mail sent to ${recipient}`);
        },
        error: (error) => {
          console.error(`Failed to send mail to ${recipient}`);
        }
      });
    });

    this.snackBar.open('Mail sent successfully', 'Close', {
      duration: 3000
    }
    );
    this.refresh();
  }

  // sidebar
  sidebarOpen = true;

  selectedTab = 'Primary';

  // side nav bar
  toggleSideBar(): void {
    this.sidebarOpen = !this.sidebarOpen
  }

  // open mail
  openMail(mail: any): void {

    this.selectedMail = mail;

    if (!mail.read) {
      mail.read = true;
      this.mailService.updateReadStatus(mail).subscribe({
        next: (updatedMail) => { },
        error: (error) => {
          mail.read = false;
        }
      });
    }
    // console.log('Opening mail:', mail);
  }

  // close mail
  closeMail(): void {
    this.selectedMail = null
  }

  // Delete opened mail
  deleteOpenedMail(): void {
    if (!this.selectedMail) {
      return;
    }

    const mail = this.selectedMail;
    this.mailService.moveToTrash(mail).subscribe({
      next: () => {
        this.mails = this.mails.filter(m => m.id !== mail.id);
        this.selectedMail = null;
      },
      error: (error) => { }
    });
  }

  // starred
  toggleStar(mail: Mail): void {
    mail.starred = !mail.starred;

    this.mailService.updateStarred(mail).subscribe({
      next: (updatedMail) => {
        console.log('Star updated:', updatedMail);
      },
      error: (error) => {
        console.error('Error updating star:', error);
        mail.starred = !mail.starred;
      }
    })
  }

  // dropdown menu
  allSelected = false;

  selectAll(): void {
    this.allSelected = true;
  }

  selectNone(): void {
    this.allSelected = false;
  }

  selectRead(): void {
    console.log('Selected: Read')
  }

  selectUnread(): void {
    console.log('Selected: Unread')
  }

  selectStarred(): void {
    console.log('Selected: Starred')
  }

  selectUnstarred(): void {
    console.log('Selected: Unstarred')
  }

  selectTab(tab: string): void {

    // close the current opened mail
    this.selectedMail = null;

    this.selectedTab = tab;

    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    // inbox
    if (tab === 'Primary') {
      this.mailService.getInboxMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading inbox:', error);
        }
      });
    }
    // starred
    else if (tab === 'Starred') {

      this.mailService.getStarredMails(currentUser.email).subscribe({
        next: (mails) => {
          const starredMails = mails.filter(mail =>
            mail.starred === true &&
            (mail.from === currentUser.email ||
              mail.to === currentUser.email) &&
            mail.trash === false
          );

          this.addMailsToBeginning(starredMails);
        },
        error: (error) => {
          console.error('Error loading starred mails:', error);
        }
      });
    }
    // sent
    else if (tab === 'Sent') {
      this.mailService.getSentMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading sent mails:', error);
        }
      });
    }

    // trash
    else if (tab === 'Trash') {
      this.mailService.getTrashMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading trash mails:', error)
        }
      });
    }
  }

  // search mails
  searchMails(): void {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      this.filteredMails = [];
      return;
    }

    this.filteredMails = this.mails.filter(mail => {
      const from = mail.from?.toLowerCase() || '';
      const to = mail.to?.toLowerCase() || '';
      const subject = mail.subject?.toLowerCase() || '';
      const body = mail.body?.toLowerCase() || '';

      return (
        from.includes(search) ||
        to.includes(search) ||
        subject.includes(search) ||
        body.includes(search)
      );
    });
  }

  // open search mail
  openSearchMail(mail: Mail): void {
    this.selectedMail = mail;
    this.searchText = '';
    this.filteredMails = [];

    // mark as read
    if (!mail.read) {
      mail.read = true;

      this.mailService.updateReadStatus(mail).subscribe({
        next: () => { },
        error: () => {
          mail.read = false;
        }
      });
    }
  }

  // clear search
  clearSearch(): void {
    this.searchText = '';
  }

  // add mails in beginning
  addMailsToBeginning(mails: Mail[]): void {
    this.allMails = [];
    this.mails = [];
    mails.forEach(mail => {
      this.mails.unshift(mail);
    });

    if (this.searchText.trim()) {
      this.searchMails();
    }
  }

  // Move mails to trash
  moveToTrash(mail: Mail): void {
    this.mailService.moveToTrash(mail).subscribe({
      next: (updatedMail) => {
        // Remove from current screen
        this.mails = this.mails.filter(
          m => m.id !== updatedMail.id
        );
        console.log('Mail moved to trash');
      },
      error: (error) => {
        console.error('Error moving mail to trash:', error);
      }
    });
  }

  // Reply mail
  replyMail(mail: Mail): void {
    if (!this.selectedMail) {
      return;
    }

    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    const dialogRef = this.dialog.open(ComposeDialog, {
      width: '550px',
      maxWidth: '95vw',
      position: {
        bottom: '0',
        right: '40px'
      },
      panelClass: 'compose-dialog-panel',
      data: {
        from: currentUser.email,
        to: this.selectedMail.from, //reply goes to the sender
        subject: this.selectedMail.subject.startsWith('Re:')
          ? this.selectedMail.subject : `Re: ${this.selectedMail.subject}`,
        body: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refresh();
      }
    });
  }

  // Forward mail
  forwardMail(): void {
    if(!this.selectedMail){
      return;
    }

    const currentUser = this.mailService.getCurrentUser();

    if(!currentUser){
      return;
    }

    const forwardedBody = `
    Forwarded Message

    From: ${this.selectedMail.from}
    To: ${this.selectedMail.to}
    Date: ${this.selectedMail.date}
    Subject: ${this.selectedMail.subject}
    ${this.selectedMail.body}
    `;

    const dialogRef = this.dialog.open(ComposeDialog, {
      width: '550px',
    maxWidth: '95vw',
    position: {
      bottom: '0',
      right: '40px'
    },
    panelClass: 'compose-dialog-panel',

    data: {
      from: currentUser.email,

      // Forward has no predefined recipient
      to: '',

      subject: this.selectedMail.subject.startsWith('Fwd:')
        ? this.selectedMail.subject
        : `Fwd: ${this.selectedMail.subject}`,

      body: forwardedBody
    }
    });

    dialogRef.afterClosed().subscribe(result =>{
      if(result){
        this.refresh();
      }
    })
  }

  // Refresh
  refresh(): void {
    this.selectTab(this.selectedTab);
  }

  // user profile
  username = '';

  userProfile = {
    name: '',
    dob: '',
    gender: '',
    phone: '',
    email: ''
  };

  // user profile modal
  openProfileModal() {
    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      this.snackBar?.open('User profile is unavailable', 'Close', {
        duration: 3000
      });
      return;
    }

    const profileData = {
      id: currentUser.id,
      name: `${currentUser.fname} ${currentUser.lname}`,
      dob: currentUser.dob,
      gender: currentUser?.gender,
      phone: currentUser?.phone,
      email: currentUser.email
    };

    const dialogRef = this.dialog.open(UserProfileDialog, {
      width: '500px',
      height: '550px',
      disableClose: true,
      data: { ...profileData }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.userProfile = result;

      // updating current user phone
      currentUser.phone = result.phone;

      if (currentUser.id === undefined) {
        this.snackBar.open('Unable to update profile', 'Close', {
          duration: 3000
        });
        return;
      }

      // update phone in db.json
      this.mailService.updateUser(currentUser.id, {
        phone: result.phone
      }).subscribe({
        next: (updatedUser) => {
          this.mailService.currentUser = updatedUser;

          // saving updated user
          localStorage.setItem('smailCurrentUser', JSON.stringify(updatedUser));

          this.snackBar.open('Profile updated successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open('Unable to update profile', 'Close', {
            duration: 3000
          });
        }
      })
    });
  }

  // logout
  logout(): void {
    this.mailService.logout();
    this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }
}
