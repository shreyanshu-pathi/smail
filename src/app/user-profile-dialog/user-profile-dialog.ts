import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from "@angular/forms";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-profile-dialog',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, DatePipe],
  templateUrl: './user-profile-dialog.html',
  styleUrl: './user-profile-dialog.scss',
})
export class UserProfileDialog {

  constructor(
    public dialogRef: MatDialogRef<UserProfileDialog>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  close(): void {
    this.dialogRef.close()
  }

  save(): void {
    this.dialogRef.close(this.data)
  }

}