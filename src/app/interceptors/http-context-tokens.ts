import { HttpContextToken } from '@angular/common/http';

export const EXPIRY_CHECK = new HttpContextToken<boolean>(() => false);