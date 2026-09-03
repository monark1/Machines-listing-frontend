import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard';
import { AuthService } from '../services/auth.service';
import { MachineService } from '../services/machine.service';
import { SalesService } from '../services/sales.service';
import { UserService } from '../services/user.service';
import { Machine } from '../models/machine.model';
import { SalesRecord } from '../models/sales-record.model';
import { User } from '../models/user.model';

describe('DashboardComponent', () => {
  let authServiceMock: { getRole: ReturnType<typeof vi.fn>; getUserName: ReturnType<typeof vi.fn> };
  let machineServiceMock: { machines: ReturnType<typeof signal<Machine[]>>; loadMachines: ReturnType<typeof vi.fn> };
  let salesServiceMock: { sales: ReturnType<typeof signal<SalesRecord[]>>; loadSales: ReturnType<typeof vi.fn> };
  let userServiceMock: { getAllUsers: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockMachines: Machine[] = [
    { id: 1, name: 'AlphaFlex', category: 'Flexo Press', launchYear: 2020, status: 'active', unitPrice: 500000, specs: { width: 1200, speed: 400, printColors: 8 } },
    { id: 2, name: 'OldPress', category: 'Extrusion', launchYear: 2015, status: 'discontinued', unitPrice: 200000, specs: { width: 800, speed: 200, printColors: 4 } }
  ];

  const mockSales: SalesRecord[] = [
    { id: 1, machineId: 1, region: 'North', quantitySold: 3, revenue: 150000, saleDate: '2025-06-01', dealerName: 'PackTech' },
    { id: 2, machineId: 2, region: 'South', quantitySold: 2, revenue: 90000, saleDate: '2025-07-01', dealerName: 'Apex' }
  ];

  const mockUsers: User[] = [
    { id: 1, username: 'emp1', password: 'x', role: 'employee', fullName: 'Emp One', email: 'e1@test.com', department: 'IT', dateJoined: '2025-01-01', status: 'active' },
    { id: 2, username: 'emp2', password: 'x', role: 'employee', fullName: 'Emp Two', email: 'e2@test.com', department: 'HR', dateJoined: '2025-01-01', status: 'inactive' },
    { id: 3, username: 'admin', password: 'x', role: 'admin', fullName: 'Admin', email: 'ad@test.com', department: 'IT', dateJoined: '2025-01-01', status: 'active' }
  ];

  function setup(role: 'employee' | 'stakeholder' | 'admin') {
    authServiceMock = {
      getRole: vi.fn().mockReturnValue(role),
      getUserName: vi.fn().mockReturnValue('Test User')
    };
    machineServiceMock = {
      machines: signal<Machine[]>(mockMachines),
      loadMachines: vi.fn()
    };
    salesServiceMock = {
      sales: signal<SalesRecord[]>(mockSales),
      loadSales: vi.fn()
    };
    userServiceMock = {
      getAllUsers: vi.fn().mockReturnValue(of(mockUsers))
    };
    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: MachineService, useValue: machineServiceMock },
        { provide: SalesService, useValue: salesServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup('employee');
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('ngOnInit — role-based data loading', () => {
    it('should always load machines, regardless of role', () => {
      setup('employee');
      expect(machineServiceMock.loadMachines).toHaveBeenCalled();
    });

    it('should NOT load sales or employees data for an employee', () => {
      const fixture = setup('employee');
      expect(salesServiceMock.loadSales).not.toHaveBeenCalled();
      expect(userServiceMock.getAllUsers).not.toHaveBeenCalled();
      expect(fixture.componentInstance.allUsers()).toEqual([]);
    });

    it('should load sales but NOT employees data for a stakeholder', () => {
      const fixture = setup('stakeholder');
      expect(salesServiceMock.loadSales).toHaveBeenCalled();
      expect(userServiceMock.getAllUsers).not.toHaveBeenCalled();
      expect(fixture.componentInstance.allUsers()).toEqual([]);
    });

    it('should load sales AND employees data for an admin', () => {
      const fixture = setup('admin');
      expect(salesServiceMock.loadSales).toHaveBeenCalled();
      expect(userServiceMock.getAllUsers).toHaveBeenCalled();
      expect(fixture.componentInstance.allUsers()).toEqual(mockUsers);
    });
  });

  describe('computed stats', () => {
    it('should compute machine totals correctly', () => {
      const fixture = setup('admin');
      const component = fixture.componentInstance;

      expect(component.totalMachines()).toBe(2);
      expect(component.activeMachines()).toBe(1);
    });

    it('should compute sales totals correctly', () => {
      const fixture = setup('admin');
      const component = fixture.componentInstance;

      expect(component.totalSalesCount()).toBe(2);
      expect(component.totalRevenue()).toBe(240000);
    });

    it('should compute employee totals correctly, counting only role === employee', () => {
      const fixture = setup('admin');
      const component = fixture.componentInstance;

      expect(component.totalEmployees()).toBe(2);
      expect(component.activeEmployees()).toBe(1);
    });
  });

  describe('navigation', () => {
    it('should navigate to /machines', () => {
      const fixture = setup('admin');
      fixture.componentInstance.goToMachines();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/machines']);
    });

    it('should navigate to /sales', () => {
      const fixture = setup('admin');
      fixture.componentInstance.goToSales();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/sales']);
    });

    it('should navigate to /employees', () => {
      const fixture = setup('admin');
      fixture.componentInstance.goToEmployees();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/employees']);
    });
  });
});