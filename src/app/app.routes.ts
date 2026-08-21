import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { Home } from './home/home';
import { Inbox } from './inbox/inbox';
import { authGuardGuard } from './guards/auth-guard-guard';
import { loginGuardGuard } from './guards/login-guard-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home},
    { path: 'signup', component: Signup },
    { path: 'login', component: Login, canActivate: [loginGuardGuard] },
    { path: 'inbox', component: Inbox, canActivate: [authGuardGuard] },
];
