import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionTimerService } from './session-timer.service';

describe('SessionTimerService', () => {
  let service: SessionTimerService;

  const NOW = new Date('2026-01-01T00:00:00.000Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionTimerService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('start', () => {
    it('should NOT call onExpire before the scheduled time elapses', () => {
      const onExpire = vi.fn();
      service.start(NOW + 5000, onExpire);

      vi.advanceTimersByTime(4999);
      expect(onExpire).not.toHaveBeenCalled();
    });

    it('should call onExpire exactly when the expiry time is reached', () => {
      const onExpire = vi.fn();
      service.start(NOW + 5000, onExpire);

      vi.advanceTimersByTime(5000);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('should call onExpire immediately if expiryMs is already in the past', () => {
      const onExpire = vi.fn();
      service.start(NOW - 1000, onExpire);

      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('should replace a pending timer when start() is called again before it fires', () => {
      const firstOnExpire = vi.fn();
      const secondOnExpire = vi.fn();

      service.start(NOW + 5000, firstOnExpire);
      service.start(NOW + 10000, secondOnExpire);
      vi.advanceTimersByTime(5000);
      expect(firstOnExpire).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000); 
      expect(secondOnExpire).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('should prevent a scheduled onExpire from ever firing', () => {
      const onExpire = vi.fn();
      service.start(NOW + 5000, onExpire);

      service.clear();
      vi.advanceTimersByTime(10000);

      expect(onExpire).not.toHaveBeenCalled();
    });

    it('should be safe to call when no timer is currently set', () => {
      expect(() => service.clear()).not.toThrow();
    });

    it('should be safe to call twice in a row', () => {
      const onExpire = vi.fn();
      service.start(NOW + 5000, onExpire);

      service.clear();
      expect(() => service.clear()).not.toThrow();
    });
  });
});