import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MailService } from '../mail-service';

export const homeGuard: CanActivateFn = () => {
  const mailService = inject(MailService);
  const router = inject(Router);

  const currentUser = mailService.getCurrentUser();

  if (currentUser) {
    return router.createUrlTree(['/inbox']);
  }

  return router.createUrlTree(['/home']);
};
