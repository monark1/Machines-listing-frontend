import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MachineListComponent } from './machine-list';
import { MachineService } from '../services/machine.service';
import { AuthService } from '../services/auth.service';
import { Machine } from '../models/machine.model';

const pdfSpies = {
  text: vi.fn(),
  save: vi.fn(),
  autoTable: vi.fn()
};

vi.mock('jspdf', () => {
  class MockjsPDF {
    text(...args: any[]) { pdfSpies.text(...args); }
    save(...args: any[]) { pdfSpies.save(...args); }
  }
  return { jsPDF: MockjsPDF };
});

vi.mock('jspdf-autotable', () => {
  return {
    autoTable: (...args: any[]) => pdfSpies.autoTable(...args)
  };
});

describe('MachineListComponent', () => {
  let machinesSignal: ReturnType<typeof signal<Machine[]>>;
  let isLoadingSignal: ReturnType<typeof signal<boolean>>;

  let machineServiceMock: any;
  let authServiceMock: any;
  let routerMock: any;

    const dummyMachines: Machine[] = [
    { id: 1, name: 'Alphaflex', category: 'Flexo Press', launchYear: 2024, status: 'active', specs: { width: 120, speed: 60, printColors: 4 }, unitPrice: 15000 },
    { id: 2, name: 'Vistaflex', category: 'Flexo Press', launchYear: 2023, status: 'discontinued', specs: { width: 150, speed: 45, printColors: 2 }, unitPrice: 22000 },
    { id: 3, name: 'Heliostar', category: 'Rotogravure Press', launchYear: 2025, status: 'active', specs: { width: 90, speed: 80, printColors: 1 }, unitPrice: 18000 },
    { id: 4, name: 'Miraflex', category: 'Printing', launchYear: 2022, status: 'active', specs: { width: 60, speed: 120, printColors: 0 }, unitPrice: 5000 },
    { id: 5, name: 'Betaflex', category: 'Flexo Press', launchYear: 2024, status: 'discontinued', specs: { width: 200, speed: 30, printColors: 0 }, unitPrice: 31000 },
    { id: 6, name: 'Novoflex', category: 'Flexo Press', launchYear: 2026, status: 'active', specs: { width: 300, speed: 25, printColors: 6 }, unitPrice: 45000 }
  ];


  beforeEach(async () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    machinesSignal = signal<Machine[]>([]);
    isLoadingSignal = signal<boolean>(false);

    machineServiceMock = {
      machines: machinesSignal,
      isLoading: isLoadingSignal,
      loadMachines: vi.fn(),
      deleteMachine: vi.fn().mockReturnValue(of({})) 
    };

    authServiceMock = {
      getRole: vi.fn().mockReturnValue('employee') 
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MachineListComponent],
      providers: [
        { provide: MachineService, useValue: machineServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();
  });

  function setup(role: 'admin' | 'employee' | null = 'employee') {
    authServiceMock.getRole.mockReturnValue(role);
    machinesSignal.set([...dummyMachines]);

    const fixture = TestBed.createComponent(MachineListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges(); 
    return { fixture, component };
  }

  describe('Role Authorization Computed State', () => {
    it('should compute isAdmin as true', () => {
      const { component } = setup('admin');
      expect(component.isAdmin()).toBe(true);
    });

    it('should compute isAdmin as false', () => {
      const { component } = setup('employee');
      expect(component.isAdmin()).toBe(false);
    });
  });

  describe('Filtering and Sorting Computed State', () => {
    it('should execute default ascending sorting by name field', () => {
      const { component } = setup();
      const results = component.filteredMachines();
      expect(results[0].name).toBe('Alphaflex');
      expect(results[3].name).toBe('Miraflex');  
      expect(results[4].name).toBe('Novoflex');
    });

    it('should filter matching values case-insensitively', () => {
      const { component } = setup();
      component.onSearchChange('Rotogravure Press');

      const filtered = component.filteredMachines();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Heliostar');
    });

    it('should filter number strings correctly (e.g., launchYear)', () => {
      const { component } = setup();
      component.onSearchChange('2024');

      const filtered = component.filteredMachines();
      expect(filtered.length).toBe(2); 
    });
  });

  describe('Sorting Toggle Actions', () => {
    it('should flip calculation sorting direction criteria between asc and desc for matching rows', () => {
      const { component } = setup();
      expect(component.sortField()).toBe('name');
      expect(component.sortDirection()).toBe('asc');

      component.toggleSort('name');
      expect(component.sortDirection()).toBe('desc');
    });
  });

  describe('Pagination Operations', () => {
    it('should split results arrays evenly into chunk parameters mapping the pages', () => {
      const { component } = setup();
      expect(component.pagedMachines().length).toBe(5); 
      expect(component.totalPages()).toBe(2);
      expect(component.pageNumbers()).toEqual([1, 2]);
    });

    it('should safely guard page shifting against indexing targets out of bounds', () => {
      const { component } = setup();
      component.goToPage(-5);
      expect(component.currentPage()).toBe(1);

      component.goToPage(10);
      expect(component.currentPage()).toBe(1);

      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
    });
  });

  describe('Data Actions (Delete Operations)', () => {
    it('should execute machine record deletion', () => {
      const { component } = setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.onDelete(42);

      expect(confirmSpy).toHaveBeenCalledWith('Delete this machine?');
      expect(machineServiceMock.deleteMachine).toHaveBeenCalledWith(42);
    });

    it('should bypass service dispatch sequences if the prompt is explicitly declined', () => {
      const { component } = setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.onDelete(42);

      expect(confirmSpy).toHaveBeenCalled();
      expect(machineServiceMock.deleteMachine).not.toHaveBeenCalled();
    });
  });

  describe('File Exporter Actions', () => {
    it('should configure autoTable parameters and save generated PDF', () => {
      const { component } = setup();
      component.exportToPdf();

      expect(pdfSpies.text).toHaveBeenCalledWith('Machines Report', 14, 15);
      expect(pdfSpies.autoTable).toHaveBeenCalled();
      expect(pdfSpies.save).toHaveBeenCalledWith('machines-report.pdf');
    });

    it('should structure local window element downloads for exporting raw CSV lines', () => {
      const { component } = setup();
      
      const spyCreateUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-machine-url');
      const spyRevokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const spyClick = vi.fn();
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return { href: '', download: '', click: spyClick } as any;
        }
        return {} as any;
      });

      component.exportToCsv();

      expect(spyCreateUrl).toHaveBeenCalled();
      expect(spyClick).toHaveBeenCalled();
      expect(spyRevokeUrl).toHaveBeenCalledWith('blob:mock-machine-url');
    });
  });

  describe('Router Navigation', () => {
    it('should redirect to machine addition form route', () => {
      const { component } = setup();
      component.goToAdd();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/machines/add']);
    });

    it('should redirect to machine edit form route', () => {
      const { component } = setup();
      component.goToEdit(99);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/machines', 99, 'edit']);
    });
  });
});
