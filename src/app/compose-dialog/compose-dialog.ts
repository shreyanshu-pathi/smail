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

  dialogRef = inject(MatDialogRef<ComposeDialog>);
  data = inject(MAT_DIALOG_DATA);

  composeForm: FormGroup;

  // Attachments
  selectedFile: File | null = null;
  attachmentName = '';
  attachmentData: string | null = null;
  attachmentType = '';

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
    }

    // If this is a reply
    if (this.data?.mode === 'reply') {
      this.composeForm.patchValue({
        to: this.data.to || '',
        subject: this.data.subject || '',
        body: this.data.body || ''
      });
    }

    if (this.data?.mode === 'forward') {
      this.composeForm.patchValue({
        to: '',
        subject: this.data.subject || '',
        body: this.data.body || ''
      });

      if (this.data.attachment) {
        this.attachmentName = this.data.attachment.name;
        this.attachmentData = this.data.attachment.data;
        this.attachmentType = this.data.attachment.type;
      }
    }
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
            attachment: this.attachmentData ?
              {
                name: this.attachmentName,
                type: this.attachmentType,
                data: this.attachmentData
              } : undefined
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

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.snackBar.open(
        'Please select an image file',
        'Close',
        { duration: 3000 }
      );

      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.attachmentName = file.name;
    this.attachmentType = file.type;

    const reader = new FileReader();

    reader.onload = () => {
      this.attachmentData = reader.result as string;
    };

    reader.onerror = () => {
      this.snackBar.open(
        'Unable to read attachment',
        'Close',
        { duration: 3000 }
      );

      this.selectedFile = null;
      this.attachmentName = '';
      this.attachmentData = null;
      this.attachmentType = '';
    };

    reader.readAsDataURL(file);
  }

  // remove attach files
  removeAttachment(): void {
    this.selectedFile = null;
    this.attachmentName = '';
    this.attachmentData = null;
    this.attachmentType = '';
  }

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

    const draft: Mail = {
      id: this.data?.id,
      from: currentUser.email,
      to: formValue.to?.trim() || '',
      subject: formValue.subject?.trim() || '',
      body: formValue.body || '',
      date: new Date().toISOString(),
      read: false,
      starred: false,
      trash: false,
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
}
