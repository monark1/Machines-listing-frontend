import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { SalesListComponent } from './sales-list';
import { SalesService } from '../services/sales.service';
import { MachineService } from '../services/machine.service';
import { SalesRecord } from '../models/sales-record.model';


const pdfSpies = {
  text: vi.fn(),
  save: vi.fn(),
  autoTable: vi.fn()
};

interface Machine {
  id: number;
  name: string;
}

interface SalesServiceMock {
  sales: ReturnType<typeof signal<SalesRecord[]>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  loadSales: ReturnType<typeof vi.fn>;
}

interface MachineServiceMock {
  machines: ReturnType<typeof signal<Machine[]>>;
  loadMachines: ReturnType<typeof vi.fn>;
}

vi.mock('jspdf', () => {
  class MockjsPDF {
    text(...args: unknown[]) { pdfSpies.text(...args); }
    save(...args: unknown[]) { pdfSpies.save(...args); }
  }
  return { jsPDF: MockjsPDF };
});

vi.mock('jspdf-autotable', () => {
  return {
    autoTable: (...args: unknown[]) => pdfSpies.autoTable(...args)
  };
});

describe('SalesListComponent', () => {
  let salesSignal: ReturnType<typeof signal<SalesRecord[]>>;
  let isLoadingSignal: ReturnType<typeof signal<boolean>>;
  let machinesSignal: ReturnType<typeof signal<Machine[]>>;

  let salesServiceMock: SalesServiceMock;
  let machineServiceMock: MachineServiceMock;


  const dummyMachines = [
    { id: 1, name: 'HELIOSTAR' },
    { id: 2, name: 'Vistaflex' },
  ];

  const dummySales: SalesRecord[] = [
    { id: 10, machineId: 1, region: 'North', quantitySold: 2, revenue: 5000, saleDate: '2026-01-05', dealerName: 'Alpha Corp' },
    { id: 20, machineId: 2, region: 'South', quantitySold: 1, revenue: 9000, saleDate: '2026-02-10', dealerName: 'Beta Inc' },
    { id: 30, machineId: 1, region: 'East', quantitySold: 5, revenue: 12000, saleDate: '2026-01-15', dealerName: 'Gamma LLC' },
    { id: 40, machineId: 2, region: 'West', quantitySold: 3, revenue: 3000, saleDate: '2026-03-01', dealerName: 'Delta Retail' },
    { id: 50, machineId: 1, region: 'North', quantitySold: 1, revenue: 2500, saleDate: '2026-02-20', dealerName: 'Alpha Corp' },
    { id: 60, machineId: 2, region: 'Central', quantitySold: 4, revenue: 15000, saleDate: '2026-02-28', dealerName: 'Zeta Ops' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    salesSignal = signal<SalesRecord[]>([]);
    isLoadingSignal = signal<boolean>(false);
    machinesSignal = signal<Machine[]>([]);

    salesServiceMock = {
      sales: salesSignal,
      isLoading: isLoadingSignal,
      loadSales: vi.fn(),
    };

    machineServiceMock = {
      machines: machinesSignal,
      loadMachines: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SalesListComponent],
      providers: [
        { provide: SalesService, useValue: salesServiceMock },
        { provide: MachineService, useValue: machineServiceMock },
      ],
    }).compileComponents();
  });

  function setup() {
    salesSignal.set([...dummySales]);
    machinesSignal.set([...dummyMachines]);

    const fixture = TestBed.createComponent(SalesListComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges(); 
    return { fixture, component };
  }

  it('should create and trigger service loading mechanism on init', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
    expect(salesServiceMock.loadSales).toHaveBeenCalledTimes(1);
    expect(machineServiceMock.loadMachines).toHaveBeenCalledTimes(1);
  });

  describe('getMachineName', () => {
    it('should match and map the correct machine name based on ID', () => {
      const { component } = setup();
      expect(component.getMachineName(1)).toBe('HELIOSTAR');
      expect(component.getMachineName(2)).toBe('Vistaflex');
    });

    it('should revert to Unknown if no match is found', () => {
      const { component } = setup();
      expect(component.getMachineName(999)).toBe('Unknown');
    });
  });

  describe('Filtering and Computed Sales Output', () => {
    it('should safely fall back to fallback sorting criteria', () => {
      const { component } = setup();
      const results = component.filteredSales();
      expect(results[0].saleDate).toBe('2026-03-01'); 
    });

    it('should filter items across multi-field text conditions case-insensitively', () => {
      const { component } = setup();
      component.onSearchChange('alpha');
      
      const filtered = component.filteredSales();
      expect(filtered.length).toBe(2);
      expect(filtered.every(s => s.dealerName === 'Alpha Corp')).toBe(true);
    });

    it('should handle number conditions correctly when evaluating text queries', () => {
      const { component } = setup();
      component.onSearchChange('15000');
      
      const filtered = component.filteredSales();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(60);
    });
  });

  describe('Sorting Mechanisms', () => {
    it('should toggle sort directions properly when interacting', () => {
      const { component } = setup();
      expect(component.sortField()).toBe('saleDate');
      expect(component.sortDirection()).toBe('desc');

      component.toggleSort('saleDate');
      expect(component.sortDirection()).toBe('asc');
    });
  });

  describe('Pagination Logic Streams', () => {
    it('should calculate proper constraints on slice windows for page sizing boundaries', () => {
      const { component } = setup();
      expect(component.pagedSales().length).toBe(5);
      expect(component.totalPages()).toBe(2);
      expect(component.pageNumbers()).toEqual([1, 2]);
    });

    it('should boundary protect and block navigation requests navigating outside pages array', () => {
      const { component } = setup();
      component.goToPage(3);
      expect(component.currentPage()).toBe(1);

      component.goToPage(0); 
      expect(component.currentPage()).toBe(1);

      component.goToPage(2); 
      expect(component.currentPage()).toBe(2);
    });
  });

  describe('File Exporter Actions', () => {
    it('should configure autoTable parameters and save generated PDF', () => {
      const { component } = setup();
      component.exportToPdf();

      expect(pdfSpies.text).toHaveBeenCalledWith('Sales Report', 14, 15);
      expect(pdfSpies.autoTable).toHaveBeenCalled();
      expect(pdfSpies.save).toHaveBeenCalledWith('sales-report.pdf');
    });

    it('should structure local window element downloads for exporting raw CSV lines', () => {
      const { component } = setup();
      
      const spyCreateUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const spyRevokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined );
      const spyClick = vi.fn();
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string): HTMLElement => {
        if (tagName === 'a') {
          const anchor = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
          anchor.click = spyClick;
          return anchor;
        }
        return document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      });

      component.exportToCsv();

      expect(spyCreateUrl).toHaveBeenCalled();
      expect(spyClick).toHaveBeenCalled();
      expect(spyRevokeUrl).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
