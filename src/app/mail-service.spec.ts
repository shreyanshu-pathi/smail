import { TestBed } from '@angular/core/testing';

import { MailService } from './mail-service';

describe('MailService', () => {
  let service: MailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});



// won't send mails to users that exist will valdiate
// sendToMultipleUsers(mailData: any): void {

//     const recipients = mailData.to
//         .split(',')
//         .map((email: string) => email.trim())
//         .filter((email: string) => email);

//     if (recipients.length === 0) {
//         this.snackBar.open(
//             'Enter at least one email address',
//             'Close',
//             { duration: 3000 }
//         );
//         return;
//     }

//     const currentUser = this.mailService.getCurrentUser();

//     if (!currentUser) {
//         return;
//     }

//     this.mailService.getUsers().subscribe({

//         next: (users) => {

//             const validRecipients = recipients.filter(
//                 (email: string) =>
//                     users.some(user => user.email === email)
//             );

//             const invalidRecipients = recipients.filter(
//                 (email: string) =>
//                     !users.some(user => user.email === email)
//             );

//             if (invalidRecipients.length > 0) {

//                 this.snackBar.open(
//                     `User not found: ${invalidRecipients.join(', ')}`,
//                     'Close',
//                     { duration: 4000 }
//                 );
//             }

//             if (validRecipients.length === 0) {
//                 return;
//             }

//             validRecipients.forEach(
//                 (recipient: string) => {

//                     const mail: Mail = {

//                         from: currentUser.email,

//                         to: recipient,

//                         subject: mailData.subject,

//                         body: mailData.body,

//                         date: new Date().toISOString(),

//                         read: false,

//                         starred: false,

//                         trash: false
//                     };

//                     this.mailService.sendMail(mail)
//                         .subscribe({

//                             next: () => {
//                                 console.log(
//                                     'Mail sent to:',
//                                     recipient
//                                 );
//                             },

//                             error: (error) => {
//                                 console.error(
//                                     'Error sending mail:',
//                                     error
//                                 );
//                             }

//                         });
//                 }
//             );

//             this.snackBar.open(
//                 `Mail sent to ${validRecipients.length} user(s)`,
//                 'Close',
//                 { duration: 3000 }
//             );

//             this.refresh();
//         },

//         error: (error) => {

//             console.error(
//                 'Unable to get users',
//                 error
//             );

//         }

//     });
// }