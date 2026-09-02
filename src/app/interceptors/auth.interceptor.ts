import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token  = inject(TokenService);
  const auth  = inject(AuthService);

  const accessToken = token.getAccessToken();

  if (accessToken && !auth.isLoggedIn() ) {
    if (auth.isRefreshTokenValid()) {
    auth.reAuthNeeded.set(true);
    } else {
      auth.logout();        
    }
    
  }

  if (accessToken) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};