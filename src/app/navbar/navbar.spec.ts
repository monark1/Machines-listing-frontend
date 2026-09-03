import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NavbarComponent } from './navbar';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';

describe('NavbarComponent', () => {
  
  const getRoleSpy = vi.fn();
  const getUserNameSpy = vi.fn().mockReturnValue('Test User'); 

  const authServiceMock = { 
    getRole: getRoleSpy,
    getUserName: getUserNameSpy 
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    }).compileComponents();
  });

  function setup(role: 'employee' | 'stakeholder' | 'admin' | null) {
    getRoleSpy.mockReturnValue(role);

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup('employee');
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('role computed', () => {
    it('should reflect the employee role', () => {
      const fixture = setup('employee');
      expect(fixture.componentInstance.role()).toBe('employee');
    });

    it('should reflect the stakeholder role', () => {
      const fixture = setup('stakeholder');
      expect(fixture.componentInstance.role()).toBe('stakeholder');
    });

    it('should reflect the admin role', () => {
      const fixture = setup('admin');
      expect(fixture.componentInstance.role()).toBe('admin');
    });

    it('should return null when there is no authenticated role', () => {
      const fixture = setup(null);
      expect(fixture.componentInstance.role()).toBeNull();
    });
  });
});
