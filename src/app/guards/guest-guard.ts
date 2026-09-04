import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MailService } from '../mail-service';

export const guestGuard: CanActivateFn = () => {

  const mailService = inject(MailService);
  const router = inject(Router);

  const currentUser = mailService.getCurrentUser();

  if (currentUser) {
    router.navigate(['/inbox'], {
      replaceUrl: true
    });

    return false;
  }
  return true;
};
