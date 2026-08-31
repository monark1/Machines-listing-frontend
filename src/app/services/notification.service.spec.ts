import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('starts with an empty notifications list', () => {
    expect(service.notifications()).toEqual([]);
  });

  describe('success()', () => {
    it('adds a notification with type "success" and the given message', () => {
      service.success('Machine saved');

      const list = service.notifications();
      expect(list.length).toBe(1);
      expect(list[0].message).toBe('Machine saved');
      expect(list[0].type).toBe('success');
    });
  });

  describe('error()', () => {
    it('adds a notification with type "error" and the given message', () => {
      service.error('Something went wrong');

      const list = service.notifications();
      expect(list.length).toBe(1);
      expect(list[0].message).toBe('Something went wrong');
      expect(list[0].type).toBe('error');
    });
  });

  it('assigns unique, incrementing ids across calls', () => {
    service.success('first');
    service.error('second');
    service.success('third');

    const ids = service.notifications().map(n => n.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  describe('auto-dismiss after 4000ms', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('removes the notification automatically once 4000ms have elapsed', () => {
      service.success('temporary');

      vi.advanceTimersByTime(4000);

      expect(service.notifications().length).toBe(0);
    });
  });
});