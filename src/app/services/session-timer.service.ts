import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionTimerService {
  private timer: ReturnType<typeof setTimeout> | null = null;

  start(expiryMs: number, onExpire: () => void): void {
    this.clear();
    const msUntilExpiry = expiryMs - Date.now();
    if (msUntilExpiry <= 0) {
      onExpire();
      return;
    }
    this.timer = setTimeout(onExpire, msUntilExpiry);
  }

  clear(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}