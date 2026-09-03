import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { Mail, User } from './model';

@Injectable({
  providedIn: 'root',
})
export class MailService {
  private http = inject(HttpClient);

  private userApiUrl = 'http://localhost:3000/users';
  private mailApiUrl = 'http://localhost:3000/mails';

  // Current user
  currentUser: User | null = null;

  // promotions keywords
  private promotionKeywords: string[] = [
    'new arrivals', 'cashback', 'deals', 'save up to', 'shop now',
    'limited time', 'uber', 'order', 'promotions', 'trip offer'
  ];

  // social keywords
  private socialKeywords: string[] = [
    'facebook', 'Instagram', 'twitter', 'comment', 'post',
    'Naukri', 'Book My Show', 'snapchat', 'LinkedIn', 'Indeed'
  ];

  // updates keywords
  private updateKeywords: string[] = [
    'notification', 'confirmation', 'verified', 'successful', 'approved',
    'rejected', 'cancelled', 'update', 'received', 'failed'
  ]

  constructor() {
    // Restore logged-in user 
    const savedUser = localStorage.getItem('smailCurrentUser');

    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  // promotion check
  private isPromotion(mail: Mail): boolean {
    const text = `${mail.subject || ''}${mail.body || ''}`.toLowerCase();
    return this.promotionKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  // social check
  private isSocial(mail: Mail): boolean {
    const text = `${mail.subject || ''}${mail.body || ''}`.toLowerCase();
    return this.socialKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  private isUpdate(mail: Mail): boolean {
    const text = `${mail.subject || ''}${mail.body || ''}`.toLowerCase();
    return this.updateKeywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  // create new user
  addUser(user: User): Observable<User> {
    return this.http.post<User>(this.userApiUrl, user)
  }

  // Gets all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userApiUrl);
  }

  // retrieves user by email
  getUserByEmail(email: String): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.userApiUrl}?email=${email}`
    )
  }

  // change of email of the same user
  private normalizeEmail(email: string | null | undefined): string {
    return (email || '').trim().toLowerCase();
  }

  // storing the user email in array of the same user
  private getUserEmails(user: User): string[] {
    const emails = [
      user.email,
      ...(user.emailAliases || [])
    ];

    return emails.filter(Boolean).map(email => this.normalizeEmail(email))
  }


  updateUserEmail(user: User, newEmail: string): Observable<User> {
    const oldEmail = this.normalizeEmail(user.email);
    const normalizeNewEmail = this.normalizeEmail(newEmail);

    let aliases = [...(user.emailAliases || [])]
      .map(email => this.normalizeEmail(email)).filter(email => email !== normalizeNewEmail);

    if (oldEmail && oldEmail !== normalizeNewEmail && !aliases.includes(oldEmail)) {
      aliases.push(oldEmail);
    }
    return this.http.patch<User>(
      `${this.userApiUrl}/${user.id}`,
      {
        email: normalizeNewEmail,
        emailAliases: aliases,
        emailLastChangedAt: new Date().toISOString(),
        emailChangeStartedAt: null,
        emailChangeExpiresAt: null
      }
    )
  }

  // retrieves user by phone
  getUserByPhone(phone: string): Observable<User[]> {
    const normalizedPhone = String(phone).replace(/\D/g, '');

    return this.http.get<User[]>(this.userApiUrl).pipe(
      map(users => users.filter(user => String(user.phone ?? '').replace(/\D/g, '') === normalizedPhone
      ))
    );
  }

  // retrieves user by email or phone
  getUser(identifer: string): Observable<User[]> {
    if (identifer.includes('@')) {
      return this.getUserByEmail(identifer);
    }
    return this.getUserByPhone(identifer);
  }

  // currentuser 
  setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('smailCurrentUser', JSON.stringify(user))
  }

  // get current user
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const storedUser = localStorage.getItem('smailCurrentUser');

    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      return this.currentUser
    }
    return null;
  }

  // update user profile
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(
      `${this.userApiUrl}/${id}`,
      userData
    )
  }

  //send mails to user
  sendMail(mail: Mail): Observable<Mail> {

    const promotion = this.isPromotion(mail);
    const social = !promotion && this.isSocial(mail);
    const update = !promotion && !social && this.isUpdate(mail);

    const newMail: Mail = {
      ...mail,

      // Reply uses existing threadId n New mail gets a new threadId.
      threadId: mail.threadId || this.generateThreadId(),

      promotion,
      social,
      updates: update,

      draft: false,
      trash: false,
      spam: false,
      archived: false,

      date: mail.date || new Date().toISOString()
    };

    return this.http.post<Mail>(this.mailApiUrl, newMail);
  }

  // generates threads
  private generateThreadId(): string {
    return 'thread-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  }

  // make sure that an existing mail belongs to a converstaion
  ensureThreadId(mail: Mail): Observable<Mail> {

    // already belongs to thread
    if (mail.threadId) {
      return of(mail);
    }

    // create a new thread id for original message
    const threadId = this.generateThreadId();

    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      {
        threadId: threadId
      }
    )
  }

  // get conversation mails
  getConversation(threadId: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?threadId=${encodeURIComponent(threadId)}`
    ).pipe(
      map(mails => mails.filter(mail => mail.trash !== true && mail.spam !== true)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    )
  }

  // get all mails
  getMails(): Observable<Mail[]> {
    return this.http.get<Mail[]>(this.mailApiUrl);
  }

  //Inbox mail
  // getInboxMails(email: string): Observable<Mail[]> {
  //   return this.http.get<Mail[]>(this.mailApiUrl).pipe(
  //     map(mails =>
  //       mails.filter(mail => {

  //         // recieves inbox mails
  //         const isReceivedMail = mail.to?.toLowerCase() === email.toLowerCase();

  //         // failed outgoing mail when address is not found
  //         const isFailedOutgoingMail = mail.from?.toLowerCase() === email.toLowerCase() &&
  //           mail.deliveryFailed === true;

  //         return (
  //           (isReceivedMail || isFailedOutgoingMail) &&
  //           mail.draft !== true &&
  //           mail.spam !== true &&
  //           mail.snoozed !== true &&
  //           mail.archived !== true &&
  //           mail.trash !== true &&
  //           mail.promotion !== true &&
  //           mail.social !== true &&
  //           mail.updates !== true
  //         )
  //       })
  //     )
  //   );
  // }

  getInboxMails(email: string): Observable<Mail[]> {

  return this.getUserByEmail(email).pipe(

    switchMap(users => {

      if (!users.length) {
        return of([]);
      }

      const user = users[0];

      const userEmails = this.getUserEmails(user);

      return this.http.get<Mail[]>(this.mailApiUrl).pipe(

        map(mails =>
          mails.filter(mail => {

            const mailTo = this.normalizeEmail(mail.to);
            const mailFrom = this.normalizeEmail(mail.from);

            // Mail belongs to this user's mailbox
            const isReceivedMail =
              userEmails.includes(mailTo);

            // Failed outgoing mail
            const isFailedOutgoingMail =
              userEmails.includes(mailFrom) &&
              mail.deliveryFailed === true;

            return (
              (isReceivedMail || isFailedOutgoingMail) &&
              mail.draft !== true &&
              mail.spam !== true &&
              mail.snoozed !== true &&
              mail.archived !== true &&
              mail.trash !== true &&
              mail.promotion !== true &&
              mail.social !== true &&
              mail.updates !== true
            );
          })
        )

      );
    })
  );
}

  // get sent mail
  // getSentMails(email: string): Observable<Mail[]> {
  //   return this.http.get<Mail[]>(
  //     `${this.mailApiUrl}?from=${encodeURIComponent(email)}&trash=false&spam=false`
  //   );
  // }

  getSentMails(email: string): Observable<Mail[]> {

  return this.getUserByEmail(email).pipe(

    switchMap(users => {

      if (!users.length) {
        return of([]);
      }

      const user = users[0];

      const userEmails = this.getUserEmails(user);

      return this.http.get<Mail[]>(this.mailApiUrl).pipe(

        map(mails =>
          mails.filter(mail => {

            const mailFrom = this.normalizeEmail(mail.from);

            return (
              userEmails.includes(mailFrom) &&
              mail.trash !== true &&
              mail.spam !== true
            );

          })
        )

      );

    })

  );
}
  // get starred mails
  getStarredMails(email: string): Observable<Mail[]> {
    return this.getMails();
  }

  // get snoozed mails
  getSnoozedMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?to=${email}&snoozedUntil_ne=null`  //filter mail which are not equal to null
    );
  }

  // get archived mails
  getArchivedMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?archived=true&trash=false`
    );
  }

  // Update starred status
  updateStarred(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      { starred: mail.starred }
    );
  }

  // snoozed mail
  snoozeMail(mail: Mail, snoozedUntil: string): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      {
        snoozed: true,
        snoozedUntil: snoozedUntil
      }
    )
  }

  // Move mail to trashs
  moveToTrash(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      { trash: true, draft: false }
    );
  }

  // drafts
  getDrafts(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?from=${encodeURIComponent(email)}&draft=true&trash=false&spam=false`
    )
  }

  // save drafts
  saveDraft(mail: Mail): Observable<Mail> {
    const draft: Mail = {
      ...mail,
      draft: true,
      trash: false,
      spam: false,
      promotion: false
    };
    return this.http.post<Mail>(this.mailApiUrl, draft);
  }

  // update exisiting draft
  updateExistingDraft(mail: Mail): Observable<Mail> {
    if (!mail.id) {
      return this.saveDraft(mail);
    }
    const draft: Mail = {
      ...mail,
      draft: true
    };
    return this.http.patch<Mail>(`${this.mailApiUrl}/${mail.id}`, draft);
  }

  // delete draft
  deleteDraft(id: number): Observable<void> {
    return this.http.delete<void>(`${this.mailApiUrl}/${id}`)
  }

  // Get trash mails
  // getTrashMails(email: string): Observable<Mail[]> {
  //   return this.http.get<Mail[]>(
  //     `${this.mailApiUrl}?trash=true`
  //   ).pipe(
  //     map((mails: Mail[]) =>
  //       mails.filter(mail =>
  //         mail.trash === true && (
  //           mail.to === email || mail.from === email
  //         )
  //       )
  //     )
  //   );
  // }

  getTrashMails(email: string): Observable<Mail[]> {

  return this.getUserByEmail(email).pipe(

    switchMap(users => {

      if (!users.length) {
        return of([]);
      }

      const user = users[0];

      const userEmails = this.getUserEmails(user);

      return this.http.get<Mail[]>(
        `${this.mailApiUrl}?trash=true`
      ).pipe(

        map(mails =>
          mails.filter(mail => {

            const mailTo = this.normalizeEmail(mail.to);
            const mailFrom = this.normalizeEmail(mail.from);

            return (
              mail.trash === true &&
              (
                userEmails.includes(mailTo) ||
                userEmails.includes(mailFrom)
              )
            );

          })
        )

      );

    })

  );
}

  // read status  
  updateReadStatus(mail: Mail) {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      {
        read: mail.read
      }
    );
  }

  // archive mails
  archiveMail(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(`${this.mailApiUrl}/${mail.id}`,
      { archived: true }
    );
  }

  // unarchive mail which moves back to inbox
  unarchiveMail(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      { archived: false }
    );
  }

  // get spam mails
  getSpamMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?spam=true&trash=false`
    );
  }

  // report spam which moves to spam field
  markAsSpam(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      { spam: true }
    );
  }

  // move mail from spam back to inbox
  removeFromSpam(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      {
        spam: false,
        archived: false
      }
    );
  }

  // Get promoitonal mails
  // getPromotionalMails(email: string): Observable<Mail[]> {
  //   return this.http.get<Mail[]>(
  //     `${this.mailApiUrl}?to=${encodeURIComponent(email)}&trash=false`
  //   ).pipe(
  //     map((mails: Mail[]) =>
  //       mails.filter(mail =>
  //         mail.promotion === true &&
  //         mail.draft != true &&
  //         mail.archived !== true &&
  //         mail.spam !== true
  //       )
  //     )
  //   );
  // }

  getPromotionalMails(email: string): Observable<Mail[]> {

  return this.getUserByEmail(email).pipe(

    switchMap(users => {

      if (!users.length) {
        return of([]);
      }

      const user = users[0];

      const userEmails = this.getUserEmails(user);

      return this.http.get<Mail[]>(this.mailApiUrl).pipe(

        map(mails =>
          mails.filter(mail => {

            const mailTo = this.normalizeEmail(mail.to);

            return (
              userEmails.includes(mailTo) &&
              mail.promotion === true &&
              mail.draft !== true &&
              mail.archived !== true &&
              mail.spam !== true &&
              mail.trash !== true
            );

          })
        )

      );

    })

  );
}

resolveEmail(email: string): Observable<string> {

  const normalizedEmail = this.normalizeEmail(email);

  return this.http.get<User[]>(this.userApiUrl).pipe(

    map(users => {

      const user = users.find(user => {

        const currentEmail =
          this.normalizeEmail(user.email);

        const aliases =
          (user.emailAliases || [])
            .map(alias => this.normalizeEmail(alias));

        return (
          currentEmail === normalizedEmail ||
          aliases.includes(normalizedEmail)
        );

      });

      // If it belongs to an existing user,
      // deliver it to the current email.
      if (user) {
        return user.email;
      }

      // Normal external email
      return email;
    })

  );
}

  // manually move/mark an existing mail as a Promotional mail
  // markAsPromotion(mail: Mail): Observable<Mail> {
  //   return this.http.patch<Mail>(`${this.mailApiUrl}/${mail.id}`, { promotion: true });
  // }

  // get social mails
  getSocialMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?to=${encodeURIComponent(email)}&trash=false`
    ).pipe(
      map((mails: Mail[]) =>
        mails.filter(mail =>
          mail.social === true &&
          mail.promotion !== true &&
          mail.updates !== true &&
          mail.draft != true &&
          mail.archived !== true &&
          mail.spam !== true
        )
      )
    );
  }

  // get update mails
  getUpdateMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?to=${encodeURIComponent(email)}&trash=false`
    ).pipe(
      map((mails: Mail[]) =>
        mails.filter(mail =>
          mail.to === email &&
          mail.updates === true &&
          mail.draft != true &&
          mail.archived !== true &&
          mail.spam !== true &&
          mail.trash !== true
        )
      )
    )
  }

  // undo from trash
  undoTrash(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      {
        trash: false
      }
    );
  }

  // undo from archive
  undoArchive(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      {
        archived: false
      }
    );
  }

  // undo from spam
  undoSpam(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`, {
      spam: false
    }
    );
  }

  startEmailChangeWindow(user: User): Observable<User> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    return this.http.patch<User>(
      `${this.userApiUrl}/${user.id}`,
      {
        emailChangeStartedAt: now.toISOString(),
        emailChangeExpiresAt: expiresAt.toISOString()
      });
  }

  clearEmailChangeWindow(userId: number): Observable<User> {
    return this.http.patch<User>(
      `${this.userApiUrl}/${userId}`, {
      emailChangeStartedAt: null,
      emailChangeExpiresAt: null
    }
    )
  }

  // logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('smailCurrentUser');
  }
}