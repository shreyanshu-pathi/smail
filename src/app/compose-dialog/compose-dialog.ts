import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MailService } from '../mail-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Mail } from '../model';

@Component({
  selector: 'app-compose-dialog',
  imports: [MatIconModule, MatTooltipModule, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatSnackBarModule, MatFormFieldModule],
  templateUrl: './compose-dialog.html',
  styleUrl: './compose-dialog.scss',
})
export class ComposeDialog {
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);
  mailService = inject(MailService);

  isMinimized: boolean = false;
  isMaximized: boolean = false;

  users: any[] = [];
  filteredUsers: any[] = [];
  showSuggestions: boolean = false;

  attachments: {
    name: string;
    type: string;
    data: string;
  }[] = [];

  dialogRef = inject(MatDialogRef<ComposeDialog>);
  data = inject(MAT_DIALOG_DATA);

  composeForm: FormGroup;

  // draft
  isDraft: boolean = false;

  constructor() {
    this.composeForm = this.fb.group({
      to: ['', Validators.required],
      subject: ['', Validators.required],
      body: ['', Validators.required]
    });

    // existing draft
    if (this.data?.mode === 'draft') {
      this.isDraft = true;

      this.composeForm.patchValue({
        to: this.data.to || '',
        subject: this.data.subject || '',
        body: this.data.body || ''
      });
      if (this.data?.attachments) {
        this.attachments = [...this.data.attachments]
      }
      else if (this.data?.attachment) {
        this.attachments = [
          {
            name: this.data.attachment.name,
            type: this.data.attachment.type,
            data: this.data.attachment.data
          }
        ];
      }
    }

    // If this is a reply
    if (this.data?.mode === 'reply') {
      this.composeForm.patchValue({
        to: this.data.to || '',
        subject: this.data.subject || '',
        body: this.data.body || ''
      });
      if (this.data?.attachments) {
        this.attachments = [...this.data.attachments]
      }
      else if (this.data?.attachment) {
        this.attachments = [
          {
            name: this.data.attachment.name,
            type: this.data.attachment.type,
            data: this.data.attachment.data
          }
        ];
      }
    }

    if (this.data?.mode === 'forward') {
      this.composeForm.patchValue({
        to: '',
        subject: this.data.subject || '',
        body: this.data.body || ''
      });
      if (this.data?.attachments) {
        this.attachments = [...this.data.attachments]
      }
      else if (this.data?.attachment) {
        this.attachments = [
          {
            name: this.data.attachment.name,
            type: this.data.attachment.type,
            data: this.data.attachment.data
          }
        ];
      }
    }
  }

  // load saved users
  ngOnInit(): void {
    this.mailService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Failed to load users', error);
      }
    })
  }

  // autocomplete 
  onToInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim().toLowerCase();

    if (!value) {
      this.filteredUsers = [];
      this.showSuggestions = false;
      return;
    }

    this.filteredUsers = this.users.filter(user => user.email?.toLowerCase().includes(value)).slice(0, 5);
    this.showSuggestions = this.filteredUsers.length > 0;
  }

  // selects the user
  selectRecipient(user: any): void {
    this.composeForm.patchValue({
      to: user.email
    });

    this.filteredUsers = [];
    this.showSuggestions = false;
  }

  // send mail from compose
  sendMail(): void {

    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    const formValue = this.composeForm.value;

    const recipients: string[] = formValue.to
      .split(',').map((email: string) => email.trim()).filter((email: string) => email !== '');

    const toControl = this.composeForm.get('to');

    // No recipients
    if (recipients.length === 0) {
      toControl?.setErrors({
        required: true
      });

      toControl?.markAsTouched();
      return;
    }

    // Validate email format
    const invalidEmails = recipients.filter(
      (email: string) => !this.isValidEmail(email)
    );

    if (invalidEmails.length > 0) {
      toControl?.setErrors({
        invalidEmail: true
      });

      toControl?.markAsTouched();
      return;
    }

    // get registered users
    this.mailService.getUsers().subscribe({
      next: (users) => {

        const registeredRecipients = recipients.filter(
          (email: string) => users.some(user => user.email.toLowerCase() === email.toLowerCase()));

        const invalidRecipients = recipients.filter(
          (email: string) => !users.some(user => user.email.toLowerCase() === email.toLowerCase()));

        let sentCount = 0;

        recipients.forEach((recipient: string) => {

          const mail: Mail = {

            from: this.data.from,
            to: recipient,  // Individual recipient
            subject: this.composeForm.value.subject,
            body: this.composeForm.value.body,
            date: new Date().toISOString(),

            read: false,
            starred: false,
            trash: false,
            draft: false,
            spam: false,
            archived: false,

            deliveryFailed: invalidRecipients.some(
              email => email.toLowerCase() === recipient.toLowerCase()),

            deliveryError: invalidRecipients.some(
              email => email.toLowerCase() === recipient.toLowerCase()) ? 'Address not found' : undefined,

            // Reply keeps original thread
            threadId: this.data.mode === 'reply' ? this.data.threadId : undefined,

            // Message being replied to
            replyToId: this.data.mode === 'reply' ? this.data.replyToId : undefined,

            // image attachment
            attachments: this.attachments.length > 0 ? [...this.attachments] : undefined
          };

          this.mailService.sendMail(mail).subscribe({

            next: () => {

              sentCount++;

              // Delete original draft if necessary
              if (this.isDraft && this.data?.id) {
                this.mailService.deleteDraft(this.data.id).subscribe({
                  next: () => {
                    console.log('Draft removed');
                  },
                  error: (error) => {
                    console.error('Error deleting draft', error);
                  }
                });
              }

              // Close only after successful send
              if (sentCount === recipients.length) {
                this.snackBar.open('Email sent', 'Close', {
                  duration: 3000
                });
                this.dialogRef.close({
                  sent: true
                });
              }
            },

            error: (error) => {
              console.error('Error sending email:', error);
              this.snackBar.open('Email not sent', 'Close', {
                duration: 3000
              });
            }
          });
        });
      },

      error: (error) => {
        console.error('Error getting users:', error);
        this.snackBar.open('Unable to verify recipient', 'Close',
          {
            duration: 3000
          }
        );
      }
    });
  }

  // Attach files
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Please select an image file', 'Close', {
          duration: 3000
        });
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        this.attachments.push({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
      };

      reader.onerror = () => {
        this.snackBar.open(
          'Unable to read attachment',
          'Close',
          { duration: 3000 }
        );
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  // remove attach files
  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  // toggle minimize and maximize
  toggleMinimize(): void {
    if (this.isMinimized) {
      this.isMinimized = false;

      this.dialogRef.updateSize('550px', 'auto');

      this.dialogRef.updatePosition({
        bottom: '20px',
        right: '40px'
      });
    } else {
      this.isMinimized = true;
      this.isMaximized = false;

      this.dialogRef.updateSize('550px', '50px');

      this.dialogRef.updatePosition({
        bottom: '20px',
        right: '40px'
      });
    }
  }

  // close the compose dialog
  closeDialog(): void {
    this.saveDraft();
  }

  // save draft when clicked on close button
  saveDraft(): void {
    const formValue = this.composeForm.value;

    const currentUser = this.mailService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const isTrashedDraft = this.isDraft && this.data?.trash === true;

    const draft: Mail = {
      id: this.data?.id,
      from: currentUser.email,
      to: formValue.to?.trim() || '',
      subject: formValue.subject?.trim() || '',
      body: formValue.body || '',
      date: new Date().toISOString(),
      read: false,
      starred: false,
      trash: isTrashedDraft,
      draft: true,
      threadId: this.data?.threadId,
      replyToId: this.data?.replyToId
    };

    const request = this.isDraft && draft.id
      ? this.mailService.updateExistingDraft(draft) : this.mailService.saveDraft(draft);

    request.subscribe({
      next: () => {
        this.snackBar.open('Draft saved', 'Close', { duration: 3000 });
        this.dialogRef.close({
          draftSaved: true
        })
      },
      error: (error) => {
        console.error('Error saving draft', error);
        this.snackBar.open('Unable to save draft', 'Close', { duration: 3000 })
      }
    })
  }

  // checks if email pattern is valid 
  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  isReplyMode(): boolean {
    return this.data?.mode === 'reply';
  }
}
