import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-create-label-dialog',
  imports: [MatFormFieldModule, MatDialogModule, MatButtonModule, MatIconModule, MatInputModule, FormsModule],
  templateUrl: './create-label-dialog.html',
  styleUrl: './create-label-dialog.scss',
})
export class CreateLabelDialog {
  dialogRef = inject(MatDialogRef<CreateLabelDialog>);

  data = inject(MAT_DIALOG_DATA, { optional: true });

  labelName = '';

  isEditMode: boolean = false;

  constructor() {
    if (this.data?.mode === 'edit') {
      this.isEditMode = true;
      this.labelName = this.data.label?.name || '';
    }
  }

  createLabel(): void {
    const name = this.labelName.trim();

    if (!name) {
      return;
    }
    this.dialogRef.close(name);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}