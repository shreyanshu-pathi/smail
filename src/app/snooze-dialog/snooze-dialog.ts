import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-snooze-dialog',
  imports: [MatFormFieldModule, MatButtonModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule, FormsModule, MatInputModule],
  templateUrl: './snooze-dialog.html',
  styleUrl: './snooze-dialog.scss',
})
export class SnoozeDialog {
  dialogRef = inject(MatDialogRef<SnoozeDialog>);
  data = inject(MAT_DIALOG_DATA);

  selectedDate: Date | null = null;

  selectedTime = '';
  minDate = new Date();

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.selectedDate || !this.selectedTime) {
      return;
    }

    const [hours, minutes] = this.selectedTime.split(':').map(Number);

    const snoozeDate = new Date(this.selectedDate);

    snoozeDate.setHours(hours);
    snoozeDate.setMinutes(minutes);
    snoozeDate.setSeconds(0);

    if (snoozeDate <= new Date()) {
      return;
    }

    this.dialogRef.close({
      snoozedUntil: snoozeDate.toISOString()
    });
  }
}