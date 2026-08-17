import { AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';

export function usernameTakenValidator(): AsyncValidatorFn {
  const userService = inject(UserService);

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const username = control.value?.trim();
    if (!username) return of(null);

    return timer(500).pipe(
      switchMap(() => userService.isUsernameTaken(username)),
      map(isTaken => (isTaken ? { usernameTaken: true } : null)),
      catchError(() => of(null))
    );
  };
}