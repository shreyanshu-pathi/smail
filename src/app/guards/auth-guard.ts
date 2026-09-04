import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MailService } from '../mail-service';

export const authGuard: CanActivateFn = () => {

  const mailService = inject(MailService);
  const router = inject(Router);

  const currentUser = mailService.getCurrentUser();

  if (currentUser) {
    return true;
  }

  router.navigate(['/login'], {
    replaceUrl: true
  });

  return false;
};
