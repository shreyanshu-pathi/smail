import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from "@angular/material/tooltip";
import { Router } from '@angular/router';

@Component({
  selector: 'app-help-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltip],
  templateUrl: './help-dialog.html',
  styleUrl: './help-dialog.scss',
})
export class HelpDialog {

  dialogRef= inject(MatDialogRef<HelpDialog>);
  router = inject(Router);

  signup(): void {
    this.router.navigate(['/signup']);
  }

  signIn():void{
    this.router.navigate(['/login']);
  }
  
  // close dialog
  closeDialog(): void {
    this.dialogRef.close();
  }
}
