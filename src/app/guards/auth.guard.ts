import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isLoggedIn()) return true;

  if (auth.isRefreshTokenValid()) {
    auth.reAuthNeeded.set(true);
    return false;
  }

  auth.logout();
  return false;
};
