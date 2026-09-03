import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { EmployeeListComponent } from './employee-list';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/user.model';

describe('EmployeeListComponent', () => {
  let userServiceMock: any;
  let notificationMock: any;

  const dummyUsers: User[] = [
    { id: 1, username: 'monark', password: 'x', role: 'employee', fullName: 'Monark Bhardwaj', email: 'monark@test.com', department: 'IT', dateJoined: '2025-01-01', status: 'active' },
    { id: 2, username: 'priya', password: 'x', role: 'employee', fullName: 'priya sharma', email: 'priya@test.com', department: 'hr', dateJoined: '2025-02-01', status: 'inactive' },
    { id: 3, username: 'admin', password: 'x', role: 'admin', fullName: 'Admin', email: 'admin@test.com', department: 'IT', dateJoined: '2025-01-01', status: 'active' },
    { id: 4, username: 'stake', password: 'x', role: 'stakeholder', fullName: 'Stake', email: 'stake@test.com', department: 'Sales', dateJoined: '2025-01-01', status: 'active' },
    { id: 5, username: 'anita', password: 'x', role: 'employee', fullName: 'Anita Verma', email: 'anita@test.com', department: 'Finance', dateJoined: '2025-03-01', status: 'active' }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    userServiceMock = {
      getAllUsers: vi.fn().mockReturnValue(of(dummyUsers)),
      updateUserStatus: vi.fn().mockReturnValue(of({}))
    };

    notificationMock = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [EmployeeListComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: NotificationService, useValue: notificationMock }
      ]
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(EmployeeListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges(); 
    return { fixture, component };
  }

  describe('Initial Load', () => {
    it('should load all users and set isLoading back to false', () => {
      const { component } = setup();
      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
      expect(component.allUsers()).toEqual(dummyUsers);
      expect(component.isLoading()).toBe(false);
    });

    it('should keep allUsers empty and clear isLoading if the load fails', () => {
      userServiceMock.getAllUsers.mockReturnValue(throwError(() => new Error('network error')));
      const { component } = setup();

      expect(component.allUsers()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Role Filtering', () => {
    it('should only include users with role employee, excluding admin and stakeholder', () => {
      const { component } = setup();
      const names = component.employees().map(u => u.fullName);

      expect(component.employees().length).toBe(3);
      expect(names).not.toContain('Admin');
      expect(names).not.toContain('Stake');
    });
  });

  describe('Search Filtering', () => {
    it('should filter matching values across name, email, department, status', () => {
      const { component } = setup();
      component.onSearchChange('priya');

      const filtered = component.employees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].fullName).toBe('priya sharma');
    });

    it('should match on department regardless of stored casing', () => {
      const { component } = setup();
      component.onSearchChange('HR');

      const filtered = component.employees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].department).toBe('hr');
    });

    it('should match on status', () => {
      const { component } = setup();
      component.onSearchChange('inactive');

      const filtered = component.employees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('inactive');
    });
  });

  describe('Sorting', () => {
    it('should default to ascending sort by fullName', () => {
      const { component } = setup();
      const names = component.employees().map(u => u.fullName);

 
      expect(names).toEqual(['Anita Verma', 'Monark Bhardwaj', 'priya sharma']);
    });

    it('should flip direction on toggling the same field twice', () => {
      const { component } = setup();
      expect(component.sortField()).toBe('fullName');
      expect(component.sortDirection()).toBe('asc');

      component.toggleSort('fullName');
      expect(component.sortDirection()).toBe('desc');

      const names = component.employees().map(u => u.fullName);
      expect(names).toEqual(['priya sharma', 'Monark Bhardwaj', 'Anita Verma']);
    });

    it('should reset to ascending when switching to a different field', () => {
      const { component } = setup();
      component.toggleSort('fullName');
      expect(component.sortDirection()).toBe('desc');

      component.toggleSort('department');
      expect(component.sortField()).toBe('department');
      expect(component.sortDirection()).toBe('asc');
    });
  });

  describe('Status Toggle Actions', () => {
    it('should deactivate an active user after confirming', () => {
      const { component } = setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const activeUser = dummyUsers[0];

      component.toggleStatus(activeUser);

      expect(confirmSpy).toHaveBeenCalledWith(`Are you sure you want to deactivate ${activeUser.fullName}?`);
      expect(userServiceMock.updateUserStatus).toHaveBeenCalledWith(activeUser.id, 'inactive');
      expect(notificationMock.success).toHaveBeenCalledWith(`${activeUser.fullName} deactivated`);
    });

    it('should reactivate an inactive user after confirming', () => {
      const { component } = setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const inactiveUser = dummyUsers[1]; 

      component.toggleStatus(inactiveUser);

      expect(userServiceMock.updateUserStatus).toHaveBeenCalledWith(inactiveUser.id, 'active');
      expect(notificationMock.success).toHaveBeenCalledWith(`${inactiveUser.fullName} reactivated`);
    });

    it('should re-fetch the employee list after a successful status change', () => {
      const { component } = setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      userServiceMock.getAllUsers.mockClear();
      component.toggleStatus(dummyUsers[0]);

      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
    });

    it('should do nothing if the confirmation is declined', () => {
      const { component } = setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.toggleStatus(dummyUsers[0]);

      expect(userServiceMock.updateUserStatus).not.toHaveBeenCalled();
      expect(notificationMock.success).not.toHaveBeenCalled();
    });

    it('should show an error notification if the status update fails', () => {
      const { component } = setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      userServiceMock.updateUserStatus.mockReturnValue(throwError(() => new Error('server error')));

      component.toggleStatus(dummyUsers[0]);

      expect(notificationMock.error).toHaveBeenCalledWith('Could not update status');
    });
  });
});