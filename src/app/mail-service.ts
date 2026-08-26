import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Mail, User } from './model';
import { M } from '@angular/cdk/keycodes';

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

  // retrieves user by phone
  getUserByPhone(phone: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.userApiUrl}?phone=${phone}`
    )
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
  updateUser(userId: number, updatedUser: Partial<User>): Observable<User> {
    return this.http.patch<User>(
      `${this.userApiUrl}/${userId}`,
      updatedUser
    )
  }

  //send mails to user
  sendMail(mail: Mail): Observable<Mail> {

    // checks automatically if the mail is a promotional or social mail
    const promotion = this.isPromotion(mail);
    const social = !promotion && this.isSocial(mail);
    const update = !promotion && !social && this.isUpdate(mail);

    const newMail: Mail = {
      ...mail,
      promotion: promotion,
      social: social,
      updates: update,

      draft: false,
      trash: false,
      spam: false,
      archived: false
    }

    return this.http.post<Mail>(this.mailApiUrl, newMail);
    //   if (!mail.threadId) {
    //     mail.threadId = this.generateThreadId()
    //   }
    //   return this.http.post<Mail>(this.mailApiUrl, mail);
    // }

    // private generateThreadId(): string {
    //   return ('thread-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8));
  }

  // get conversation
  // getConversation(threadId: string): Observable<Mail[]> {
  //   return this.http.get<Mail[]>(`${this.mailApiUrl}?threadId=${encodeURIComponent(threadId)}`)
  //     .pipe(map((mails: Mail[]) => mails.filter(mail => mail.threadId === threadId)
  //       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
  //     )
  // }

  // get all mails
  getMails(): Observable<Mail[]> {
    return this.http.get<Mail[]>(this.mailApiUrl);
  }

  // get mails by thread(conversation)
  // getMailsByThread(threadId: string) {
  //   return this.http.get<Mail[]>(`${this.mailApiUrl}/mails?threadId=${threadId}`)
  // }

  //Inbox mail
  getInboxMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?to=${encodeURIComponent(email)}&trash=false`
    ).pipe(
      map((mails: Mail[]) =>
        mails.filter(mail =>
          mail.to === email &&
          mail.draft !== true &&
          mail.spam !== true &&
          mail.archived !== true &&
          mail.trash !== true &&
          mail.promotion !== true &&
          mail.social !== true &&
          mail.updates !== true
        )
      )
    );
  }

  // get sent mail
  getSentMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?from=${encodeURIComponent(email)}&trash=false&spam=false`
    );
  }

  // get starred mails
  getStarredMails(email: string): Observable<Mail[]> {
    return this.getMails();
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
      `${this.mailApiUrl}/${mail.id}`, { starred: mail.starred }
    );
  }

  // Move mail to trashs
  moveToTrash(mail: Mail): Observable<Mail> {
    return this.http.patch<Mail>(
      `${this.mailApiUrl}/${mail.id}`,
      { trash: true }
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
  getTrashMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?trash=true`
    );
  }

  // read status  
  updateReadStatus(mail: Mail) {
    return this.http.patch<Mail>(
      `http://localhost:3000/mails/${mail.id}`,
      {
        read: true
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
  getPromotionalMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?to=${encodeURIComponent(email)}&trash=false`
    ).pipe(
      map((mails: Mail[]) =>
        mails.filter(mail =>
          mail.promotion === true &&
          mail.draft != true &&
          mail.archived !== true &&
          mail.spam !== true
        )
      )
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

  // email change
  canChangeEmail(user: User): boolean {
    const currentYear = new Date().getFullYear();

    // Maximum 2 times changes per year
    if ((user.emailChangeCount ?? 0) >= 2) {
      return false;
    }

    // 1 hour window option
    if (user.emailChangeExpiresAt) {
      const expiresAt = new Date(user.emailChangeExpiresAt).getTime();
      const now = Date.now();
      if (now < expiresAt) {
        return true;
      }
    }
    return true;
  }

  startEmailChangeWindow(user: User): Observable<User> {
    const currentYear = new Date().getFullYear();
    let count = user.emailChangeCount ?? 0;

    // new year -> reset count
    if (user.emailChangeYear !== currentYear) {
      count = 0;
    }

    // Maximum 2 changes
    if (count >= 2) {
      throw new Error('Email change limit reached for this year');
    }

    const startedAt = new Date();

    const expiresAt = new Date(startedAt.getTime() + 60 * 60 * 1000);

    return this.updateUser(user.id!, {
      emailChangeYear: currentYear,
      emailChangeStartedAt: startedAt.toISOString(),
      emailChangeExpiresAt: expiresAt.toISOString()
    });
  }

  // Email changing
  changeEmail(user: User, newEmail: string): Observable<User> {
    const currentYear = new Date().getFullYear();
    const count = user.emailChangeCount ?? 0;

    const currentCount = user.emailChangeYear === currentYear ? count : 0;

    // Check yearly limit
    if (currentCount >= 2) {
      throw new Error('You have reached the maximum of 2 email changes for this year.');
    }

    // checks one hour window
    if (!user.emailChangeExpiresAt || Date.now() > new Date(user.emailChangeExpiresAt).getTime()) {
      throw new Error('Your 1-hour email change window has expired.');
    }

    const newCount = currentCount + 1;

    return this.updateUser(user.id!, {
      email: newEmail,
      emailChangeCount: newCount,
      emailChangeYear: currentYear,
      emailChangeStartedAt: null,
      emailChangeExpiresAt: null
    });
  }

  // logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('smailCurrentUser');
  }
}