import { AbstractControl, ValidationErrors, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
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

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value || '';
    const errors: ValidationErrors = {};

    if (/\s/.test(value))         errors['noSpaces']          = true;
    if (/(.)\1{2,}/.test(value))  errors['consecutiveChars']  = true;
    if (!/[A-Z]/.test(value))     errors['missingUppercase']  = true;
    if (!/[a-z]/.test(value))     errors['missingLowercase']  = true;
    if (!/[0-9]/.test(value))     errors['missingNumber']     = true;
    if (!/[@$!%*?&]/.test(value)) errors['missingSpecial']    = true;

    return Object.keys(errors).length ? errors : null;
  };
}