import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MailService } from '../mail-service';

export const authGuardGuard: CanActivateFn = () => {

  const mailService = inject(MailService);
  const router = inject(Router);

  const currentUser = mailService.getCurrentUser();

  if(currentUser){
    return true;
  }

  return router.createUrlTree(['/login']);
};
