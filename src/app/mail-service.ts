import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mail, User } from './model';
import { email } from '@angular/forms/signals';

@Injectable({
  providedIn: 'root',
})
export class MailService {
  private http = inject(HttpClient);

  private userApiUrl = 'http://localhost:3000/users';
  private mailApiUrl = 'http://localhost:3000/mails';

  // Current user
  currentUser: User | null = null;

  constructor() {
    // Restore logged-in user 
    const savedUser = localStorage.getItem('smailCurrentUser');

    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
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
      `${this.userApiUrl}/users/${userId}`,
      updatedUser
    )
  }

  //send mails to user
  sendMail(mail: Mail): Observable<Mail> {
    return this.http.post<Mail>(this.mailApiUrl, mail);
  }

  getMails(): Observable<Mail[]> {
    return this.http.get<Mail[]>(this.mailApiUrl);
  }

  //Inbox mail
  getInboxMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?to=${encodeURIComponent(email)}&trash=false`
    );
  }

  // get sent mail
  getSentMails(email: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(
      `${this.mailApiUrl}?from=${encodeURIComponent(email)}&trash=false`
    );
  }

  // get starred mails
  getStarredMails(email: string): Observable<Mail[]> {
    return this.getMails();
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

  // logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('smailCurrentUser');
  }
}