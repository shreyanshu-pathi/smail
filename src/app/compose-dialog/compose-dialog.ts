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

  dialogRef = inject(MatDialogRef<ComposeDialog>);
  data = inject(MAT_DIALOG_DATA);

  composeForm: FormGroup;

  // Attachments
  selectedFile: File | null = null;
  attachmentName = '';

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
        to: this.data.to,
        subject: this.data.subject,
        body: this.data.body
      });
    }
  }

  // Send mail
  sendMail(): void {

    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    const formValue = this.composeForm.value;

    const recipients: string[] = formValue.to.split(',').map((email: string) => email.trim()).
      filter((email: string) => email !== '');

    const toControl = this.composeForm.get('to');

    // check if atleast one recipient is added
    if (recipients.length === 0) {
      toControl?.setErrors({ required: true });
      toControl?.markAsTouched();
      return;
    }

    // invalid email
    const invalidEmails = recipients.filter((email: string) => !this.isValidEmail(email));

    if (invalidEmails.length > 0) {
      toControl?.setErrors({ invalidEmail: true });
      toControl?.markAsTouched();
      return;
    }

    // checks all registered recipients before sending
    this.mailService.getUsers().subscribe({
      next: (users) => {

        // checks existing recipients
        const validRecipients = recipients.filter(
          (email: string) => users.some(user => user.email.toLowerCase() === email.toLowerCase()));

        // finds recipients that don't exist
        const inValidRecipients = recipients.filter(
          (email: string) => !users.some(user => user.email.toLowerCase() === email.toLowerCase()));

        if (inValidRecipients.length > 0) {
          toControl?.setErrors({ userNotFound: true });
          toControl?.markAsTouched();
          return;
        }

        // send mail separatly evry recipient
        let count = 0;

        validRecipients.forEach((recipient: string) => {

          const mail: Mail = {
            from: this.data.from,
            to: recipient,
            subject: formValue.subject,
            body: formValue.body,
            date: new Date().toISOString(),
            read: false,
            starred: false,
            trash: false,
            draft: false
          };

          // remove the exisiting draft ater sending
          if (this.isDraft && this.data?.id) {
            this.mailService.deleteDraft(this.data.id).subscribe({
              next: () => {
                console.log('Draft removed')
              },
              error: (error) => {
                console.error('error deleting draft', error)
              }
            });
          }

          this.mailService.sendMail(mail).subscribe({
            next: () => {
              this.snackBar.open('Email sent', 'Close', {
                duration: 3000
              });
              this.dialogRef.close(this.data)
            },

            error: (error) => {
              console.error('Error sending email:', error);
              this.snackBar.open('Email not sent', 'Close', {
                duration: 3000
              });
            }
          });
        });
      }
    });
  }

  // Attach files
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    this.selectedFile = input.files[0];
    this.attachmentName = this.selectedFile.name;
  }

  // remove attach files
  removeAttachment(): void {
    this.selectedFile = null;
    this.attachmentName = '';
  }

  // close the compose dialog
  closeDialog(): void {
    this.saveDraft();
  }

  saveDraft(): void {
    const formValue = this.composeForm.value;

    const currentUser = this.mailService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // if (!formValue.to && !formValue.subject && !formValue.body) {
    //   this.dialogRef.close();
    //   return;
    // }

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
