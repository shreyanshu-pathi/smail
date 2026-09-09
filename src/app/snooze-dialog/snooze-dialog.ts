import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-snooze-dialog',
  imports: [MatFormFieldModule, MatButtonModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule, FormsModule, MatInputModule, MatSelectModule],
  templateUrl: './snooze-dialog.html',
  styleUrl: './snooze-dialog.scss',
})
export class SnoozeDialog {
  dialogRef = inject(MatDialogRef<SnoozeDialog>);
  data = inject(MAT_DIALOG_DATA);

  selectedDate: Date | null = null;

  selectedTime = '';
  selectedPeriod: 'AM' | 'PM' = 'AM';
  minDate = new Date();

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.selectedDate || !this.selectedTime) {
      return;
    }

    const [hours, minutes] = this.selectedTime.split(':').map(Number);

    let hour = hours;
    if(this.selectedPeriod === 'PM' && hour < 12){
      hour += 12;
    }

    if (this.selectedPeriod === 'AM' && hour === 12) {
        hour = 0;
    }

    const snoozeDate = new Date(this.selectedDate);

    snoozeDate.setHours(hour, minutes, 0, 0);

    if (snoozeDate <= new Date()) {
      return;
    }

    this.dialogRef.close({
      snoozedUntil: snoozeDate.toISOString()
    });
  }
}