import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getAccessToken();

  if (token && !auth.isLoggedIn() ) {
    if (auth.isRefreshTokenValid()) {
    auth.reAuthNeeded.set(true);
    } else {
      auth.logout();        
    }
    
  }

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};