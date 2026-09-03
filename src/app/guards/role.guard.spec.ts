import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceMock: { getRole: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockState = {} as RouterStateSnapshot;

  function buildRoute(roles?: string[]): ActivatedRouteSnapshot {
    return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
  }

  function runGuard(route: ActivatedRouteSnapshot) {
    return TestBed.runInInjectionContext(() => roleGuard(route, mockState));
  }

  beforeEach(() => {
    authServiceMock = { getRole: vi.fn() };
    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when the user\'s role is in the allowed list', () => {
    authServiceMock.getRole.mockReturnValue('admin');
    const route = buildRoute(['admin', 'stakeholder']);

    const result = runGuard(route);

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /dashboard when the role is not in the allowed list', () => {
    authServiceMock.getRole.mockReturnValue('employee');
    const route = buildRoute(['admin']);

    const result = runGuard(route);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should deny access when there is no authenticated role at all', () => {
    authServiceMock.getRole.mockReturnValue(null);
    const route = buildRoute(['admin', 'employee', 'stakeholder']);

    const result = runGuard(route);

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should deny access when the allowed roles list is explicitly empty', () => {
    authServiceMock.getRole.mockReturnValue('admin');
    const route = buildRoute([]);

    const result = runGuard(route);

    expect(result).toBe(false);
  });
});