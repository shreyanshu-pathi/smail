import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Home } from './home/home';
import { Inbox } from './inbox/inbox';
import { guestGuard } from './guards/guest-guard';
import { authGuard } from './guards/auth-guard';
import { Logout } from './logout/logout';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home, canActivate: [guestGuard] },
    { path: 'signup', component: Signup, canActivate: [guestGuard] },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'inbox', component: Inbox, canActivate: [authGuard] },
    { path: 'logout', component: Logout }
];
