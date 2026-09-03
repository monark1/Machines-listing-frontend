import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { EXPIRY_CHECK } from './http-context-tokens';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const auth = inject(AuthService);

  const accessToken = tokenService.getAccessToken();

  if (accessToken && !auth.isLoggedIn() && !req.context.get(EXPIRY_CHECK)) {
    if (auth.isRefreshTokenValid()) {
      auth.reAuthNeeded.set(true);
    } else {
      auth.logout();
    }
    return throwError(() => new Error('Session expired'));
  }

  if (accessToken) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
  }

  return next(req);
};