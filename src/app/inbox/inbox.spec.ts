import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inbox } from './inbox';

describe('Inbox', () => {
  let component: Inbox;
  let fixture: ComponentFixture<Inbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inbox],
    }).compileComponents();

    fixture = TestBed.createComponent(Inbox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


// forwardMail(): void {
//   if (!this.selectedMail) {
//     return;
//   }

//   const currentUser = this.mailService.getCurrentUser();

//   if (!currentUser) {
//     return;
//   }

//   const forwardedBody = `
// ---------- Forwarded message ----------

// From: ${this.selectedMail.from}
// To: ${this.selectedMail.to}
// Date: ${this.selectedMail.date}
// Subject: ${this.selectedMail.subject}

// ${this.selectedMail.body}
// `;

//   const dialogRef = this.dialog.open(ComposeDialog, {
//     width: '550px',
//     maxWidth: '95vw',
//     position: {
//       bottom: '0',
//       right: '40px'
//     },
//     panelClass: 'compose-dialog-panel',

//     data: {
//       from: currentUser.email,

//       // Forward has no predefined recipient
//       to: '',

//       subject: this.selectedMail.subject.startsWith('Fwd:')
//         ? this.selectedMail.subject
//         : `Fwd: ${this.selectedMail.subject}`,

//       body: forwardedBody
//     }
//   });

//   dialogRef.afterClosed().subscribe(result => {
//     if (result) {
//       this.refresh();
//     }
//   });
// }