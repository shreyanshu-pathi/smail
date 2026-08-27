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

import { MatDividerModule } from '@angular/material/divider';
import { SnoozeDialog } from '../snooze-dialog/snooze-dialog';
import { I } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-inbox',
  imports: [MatButtonModule, MatTooltipModule, MatIconModule, RouterLink, MatFormFieldModule,
    MatCheckboxModule, MatPaginatorModule, MatMenuModule, FormsModule, DatePipe, MatSnackBarModule,
    MatDividerModule, MatPaginatorModule],
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

  // Action mail for promotions
  selectedActionMail: Mail | null = null;

  // conversation mails
  conversation: Mail[] = []

  draftCount = 0;

  ngOnInit(): void {
    this.loadInboxMails();
    this.loadDraftCount();
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
        const now = new Date();

        const expiredSnoozedMails = mails.filter(mail =>
          mail.snoozed === true &&
          mail.snoozedUntil &&
          new Date(mail.snoozedUntil) <= now &&
          mail.trash === false
        )
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
      if (result?.draftSaved) {
        setTimeout(() => {
          this.loadDraftCount();
          // this.selectTab('Drafts');
        });
        return;
      }
      if (result) {
        return;
      }
      // this.sendMultipleUsers(email);
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
        trash: false,
        draft: false,
        spam: false,
        archived: false,
        promotion: false,
        // social: false,
        // updates: false
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

    // reopen compose for the drafts
    if (mail.draft === true) {
      this.openDraft(mail);
      return;
    }

    this.selectedMail = mail;

    if (!mail.read) {
      mail.read = true;

      this.mailService.updateReadStatus(mail).subscribe({
        next: () => { },
        error: () => {
          mail.read = false;
        }
      });
    }
    // console.log('Opening mail:', mail);
    // load complete conversation
    if (mail.threadId) {
      this.mailService.getConversation(mail.threadId).subscribe({
        next: (messages) => {
          this.conversation = messages;
        },
        error: (error) => {
          console.error('Error loading conversatioons', error);

          this.conversation = [mail];
        }
      });
    } else {
      // old mails without threadId
      this.conversation = [mail]
    }
  }

  // close mail
  closeMail(): void {
    this.selectedMail = null;
    this.conversation = [];
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
    });
  }

  // dropdown menu
  allSelected = false;

  // left panel check box which is selects and deselects all mails
  toggleSelectAll(checked: boolean): void {
    this.allSelected = checked;
    this.mails.forEach(mail => { mail.selected = checked });
  }

  // Select all mails
  selectAll(): void {
    this.mails.forEach(mail => { mail.selected = true });
    this.allSelected = true;
  }

  // selects no mails
  selectNone(): void {
    this.mails.forEach(mail => { mail.selected = false });
    this.allSelected = false;
  }

  // select only read mails
  selectRead(): void {
    this.mails.forEach(mail => { mail.selected = mail.read === true });
    this.updateSelectAllState();
  }

  // select only unread mails
  selectUnread(): void {
    this.mails.forEach(mail => { mail.selected = mail.read === false });
    this.updateSelectAllState();
  }

  //  select only starred mails
  selectStarred(): void {
    this.mails.forEach(mail => { mail.selected = mail.starred === true });
    this.updateSelectAllState();
  }

  //  select only unstarred mails
  selectUnstarred(): void {
    this.mails.forEach(mail => { mail.selected = mail.starred === false });
    this.updateSelectAllState();
  }

  // each mail box is updated upon individual selection
  updateSelectAllState(): void {
    if (this.mails.length === 0) {
      this.allSelected = false;
      return;
    }
    this.allSelected = this.mails.every(mail => { mail.selected === true });
  }

  // selects tab
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

    // snozzed
    else if (tab === 'Snoozed') {
      this.mailService.getSnoozedMails(currentUser.email).subscribe({
        next: (mails) => {

          const now = new Date();

          const activeSnoozedMails = mails.filter(mail => {
            if (!mail.snoozedUntil) {
              return true;
            }
            return new Date(mail.snoozedUntil) > now;
          });
          this.addMailsToBeginning(activeSnoozedMails);
        },
        error: (error) => {
          console.error('Error loading snoozed mails', error);
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

    // promotions
    else if (tab === 'Promotions') {
      this.mailService.getPromotionalMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading promotional mails', error);
        }
      });
    }

    // social
    else if (tab === 'Social') {
      this.mailService.getSocialMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading social mails', error);
        }
      });
    }

    // update
    else if (tab === 'Updates') {
      this.mailService.getUpdateMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading update mails', error)
        }
      });
    }

    // draft
    else if (tab === 'Drafts') {
      this.mailService.getDrafts(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading drafts:', error);
        }
      })
    }

    // All mails
    else if (tab === 'All Mails') {
      this.mailService.getMails().subscribe({
        next: (mails) => {
          const allMails = mails.filter(mail =>
            mail.trash === false &&
            mail.spam !== true && (
              mail.from === currentUser.email ||
              mail.to === currentUser.email
            )
          );
          this.addMailsToBeginning(allMails);
        },
        error: (error) => {
          console.error('Error loading all mails:', error);
        }
      });
    }

    // spam
    else if (tab === 'Spam') {
      this.mailService.getSpamMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error load spam mails', error);
        }
      });
    }

    // archived mails
    else if (tab === 'Archive') {
      this.mailService.getArchivedMails(currentUser.email).subscribe({
        next: (mails) => {
          this.addMailsToBeginning(mails);
        },
        error: (error) => {
          console.error('Error loading archived mails:', error);
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

  // snoozeMail
  snoozeMail(mail: Mail, snoozedUntil?: string): void {
    const saveSnooze = (until: string): void => {
      this.mailService.snoozeMail(mail, until).subscribe({
        next: () => {
          this.mails = this.mails.filter(m => m.id === mail.id);
          this.snackBar.open(`Email snoozed until ${new Date(until).toLocaleString()}`, 'Close', {
            duration: 3000
          });
        },

        error: (error) => {
          console.error('Error snoozing mail', error);
          this.snackBar.open('Unable to snooze email', 'Close', {
            duration: 3000
          });
        }
      });
    };

    if (snoozedUntil) {
      saveSnooze(snoozedUntil);
      return;
    }

    const dialogRef = this.dialog.open(SnoozeDialog, {
      width: '450px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.snoozedUntil) {
        saveSnooze(result.snoozedUntil);
      }
    });
  }

  // snooze for today
  snoozeLaterToday(mail: Mail): void {
    const now = new Date();
    const snoozeDate = new Date(now);
    snoozeDate.setHours(18, 0, 0, 0);

    // if 6pm is passed move to tom 9am
    if (snoozeDate <= now) {
      snoozeDate.setDate(snoozeDate.getDate() + 1);
      snoozeDate.setHours(9, 0, 0, 0);
    }
    this.snoozeMail(mail, snoozeDate.toISOString());
  }

  // snooze for tomorrow
  snoozeTomorrow(mail: Mail): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    this.snoozeMail(mail, tomorrow.toISOString());
  }

  // snooze for weekend
  snoozeWeekend(mail: Mail): void {
    const date = new Date();
    const day = date.getDay();

    // Saturday = 6
    const daysUntilSaturday = 6 - day;
    date.setDate(date.getDate() + daysUntilSaturday);
    date.setHours(8, 0, 0, 0);

    this.snoozeMail(mail, date.toISOString());
  }

  // snooze for next week
  snoozeNextWeek(mail: Mail): void {
    const date = new Date();
    const day = date.getDay();

    //      Calculate next Monday
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    date.setDate(date.getDate() + daysUntilMonday);
    date.setHours(8, 0, 0, 0);

    this.snoozeMail(mail, date.toISOString());
  }

  // customize snooze mails
  openCustomSnooze(mail: Mail): void {
    const dialogRef = this.dialog.open(SnoozeDialog, {
      width: '550px',
      maxWidth: '95vw',
      data: {
        mail: mail
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result?.snoozedUntil) {
        return;
      }

      this.applySnooze(mail, result.snoozedUntil)
    });
  }

  applySnooze(mail: Mail, snoozedUntil: string): void {
    this.mailService.snoozeMail(mail, snoozedUntil).subscribe({
      next: () => {
        // remove from current mail list
        this.mails = this.mails.filter(m => m.id !== mail.id);
        this.snackBar.open('Conversation snoozed', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error soozing mail', error);
        this.snackBar.open('Unable to snooze conversation', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // mark as unread mail
  markAsUnreadMail(mail: Mail): void {
    mail.read = false;
    this.mailService.updateReadStatus(mail).subscribe({
      next: () => {
        mail.read = false;
      },
      error: (error) => {
        console.error('Failed to mark mail as unread', error);
      }
    });
  }

  // mark as read mail
  markAsReadMail(mail: Mail): void {
    if (mail.read) {
      return;
    }

    //
    const previousState = mail.read;
    mail.read = true;

    this.mailService.updateReadStatus(mail).subscribe({
      next: (updatedMail) => {
        mail.read = updatedMail.read;
      },
      error: (error) => {
        console.error('Failed to mark as read error', error);
        mail.read = previousState;
      }
    });
  }

  // move to archive 
  archiveMail(mail: Mail): void {
    this.mailService.archiveMail(mail).subscribe({
      next: () => {
        this.mails = this.mails.filter(m => m.id !== mail.id);
        this.snackBar.open('Conversation archived', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error archiving mail:', error);
        this.snackBar.open('Unable to archive mail', 'Close', { duration: 3000 })
      }
    });
  }

  // unarchive mail which moves o inbox
  unarchiveMail(mail: Mail): void {
    this.mailService.unarchiveMail(mail).subscribe({
      next: () => {
        this.mails = this.mails.filter(m => m.id !== mail.id);
        this.snackBar.open('Mail moved to inbox', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error unarchiving mails', error);
        this.snackBar.open('Unable to move mail to inbox', 'Close', { duration: 3000 });
      }
    });
  }

  // Mark a mail as spam
  markAsSpam(mail: Mail): void {
    this.mailService.markAsSpam(mail).subscribe({
      next: (updatedMail) => {
        // removes immediately from curretn tab
        this.mails = this.mails.filter(m => m.id !== mail.id);
        this.snackBar.open('Mail moved to spam', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error moving mail to Spam:', error);
        this.snackBar.open('Unable to move mail to spam', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // remove spam from inbox
  removeSpam(mail: Mail): void {
    this.mailService.removeFromSpam(mail).subscribe({
      next: () => {
        this.mails = this.mails.filter(m => m.id !== mail.id);
        this.snackBar.open('Mail moved to inbox', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error moving mail to spam', error);
        this.snackBar.open('Unable to move mail to Inbox', 'Close', {
          duration: 3000
        });
      }
    });
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

  // Report problem
  reportPromotion(): void {

  }

  // Block sender
  blockSender(): void {

  }

  // // Reply mail
  // replyMail(mail: Mail): void {

  //   const currentUser = this.mailService.getCurrentUser();

  //   if (!currentUser) {
  //     return;
  //   }

  //   // const threadId = mail.threadId || `thread-${mail.id}`

  //   const dialogRef = this.dialog.open(ComposeDialog, {
  //     width: '550px',
  //     maxWidth: '95vw',
  //     position: {
  //       bottom: '0',
  //       right: '40px'
  //     },
  //     panelClass: 'compose-dialog-panel',
  //     data: {
  //       mode: 'reply',

  //       from: currentUser.email,

  //       to: mail.from === currentUser.email ? mail.to : mail.from, //reply goes to the sender

  //       subject: mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,

  //       body: '',

  //       threadId: mail.threadId,

  //       replyToId: mail.id
  //     }
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result) {
  //       this.refresh();
  //     }
  //   });
  // }

  replyMail(mail: Mail): void {

    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    // Make sure the conversation has a thread ID.
    const threadId = mail.threadId || `thread-${mail.id}`;

    const recipient =
      mail.from === currentUser.email
        ? mail.to
        : mail.from;

    const subject = mail.subject?.startsWith('Re:')
      ? mail.subject
      : `Re: ${mail.subject}`;

    const dialogRef = this.dialog.open(ComposeDialog, {

      width: '550px',
      maxWidth: '95vw',

      position: {
        bottom: '20px',
        right: '40px'
      },

      panelClass: 'compose-dialog-panel',

      data: {
        mode: 'reply',

        from: currentUser.email,

        to: recipient,

        subject: subject,

        body: '',

        // VERY IMPORTANT
        threadId: threadId,

        // Keep reference to message being replied to
        replyToId: mail.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result?.sent) {

        // Reload the conversation
        this.openMail(mail);

        // Also refresh the list if necessary
        this.refresh();
      }

    });
  }

  // Forward mail
  forwardMail(): void {
    if (!this.selectedMail) {
      return;
    }

    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
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
      gender: currentUser.gender,
      phone: currentUser.phone,
      email: currentUser.email,
      emailLastChangedAt: currentUser.emailLastChangedAt ?? null,
      emailChangeStartedAt: currentUser.emailChangeStartedAt ?? null,
      emailChangeExpiresAt: currentUser.emailChangeExpiresAt ?? null
    };

    const dialogRef = this.dialog.open(UserProfileDialog, {
      width: '500px',
      height: '550px',
      disableClose: true,
      data: { ...profileData }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return
      };

      // update curent user
      this.mailService.currentUser = result;

      // saving updated user
      localStorage.setItem('smailCurrentUser', JSON.stringify(result));

      // Update profile object
      this.userProfile = {
        name: `${result.fname} ${result.lname}`.trim(),
        dob: result.dob,
        gender: result.gender,
        phone: result.phone || '',
        email: result.email
      };
    });
  }

  // open draft
  openDraft(draft: Mail): void {
    const currentUser = this.mailService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    const dialogRef = this.dialog.open(ComposeDialog, {
      width: '550px',
      maxWidth: '95vw',

      position: {
        bottom: '20px',
        right: '40px'
      },

      panelClass: 'compose-dialog-panel',

      data: {
        mode: 'draft',
        id: draft.id,
        from: currentUser.email,
        to: draft.to || '',
        subject: draft.subject || '',
        body: draft.body || '',
        threadId: draft.threadId,
        replyToId: draft.replyToId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result?.draftSaved) {
        setTimeout(() => {
          this.loadDraftCount(); this.refresh();
        }, 0);
      }
    });
  }

  // Load draft count
  loadDraftCount() {
    const currentUser = this.mailService.getCurrentUser();
    if (!currentUser) {
      this.draftCount = 0
      return;
    }

    this.mailService.getDrafts(currentUser.email).subscribe({
      next: (drafts) => {
        this.draftCount = drafts.length;
      },
      error: (error) => {
        console.error('Error loading draft count:', error);
        this.draftCount = 0;
      }
    })
  }

  // logout
  logout(): void {
    this.mailService.logout();
    this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }
}
