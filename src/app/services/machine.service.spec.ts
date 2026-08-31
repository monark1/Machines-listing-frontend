import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MachineService } from './machine.services';
import { Machine, MachineDraft } from '../models/machine.model';

describe('MachineService', () => {
  let service: MachineService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:3000/machines';

  const mockMachine: Machine = {
    id: 1,
    name: 'AlphaFlex',
    category: 'Flexo Press',
    launchYear: 2020,
    status: 'active',
    unitPrice: 50000000,
    specs: { width: 1200, speed: 400, printColors: 8 }
  };

  const mockDraft: MachineDraft = {
    name: 'NewMachine',
    category: 'Extrusion',
    launchYear: 2024,
    status: 'active',
    unitPrice: 1000000,
    specs: { width: 500, speed: 300, printColors: 4 }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MachineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadMachines', () => {
    it('should populate the machines signal and clear isLoading on success', () => {
      service.loadMachines();
      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(API_URL);
      req.flush([mockMachine]);

      expect(service.machines()).toEqual([mockMachine]);
      expect(service.isLoading()).toBe(false);
    });

    it('should clear isLoading but leave machines unset on error', () => {
      service.loadMachines();

      const req = httpMock.expectOne(API_URL);
      req.error(new ProgressEvent('Network error'));

      expect(service.machines()).toEqual([]);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('getMachine', () => {
    it('should GET a single machine by id and NOT touch the machines signal', () => {
      service.getMachine(1).subscribe(machine => {
        expect(machine).toEqual(mockMachine);
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMachine);

      expect(service.machines()).toEqual([]);
    });
  });

  describe('addMachine', () => {
    it('should POST the draft and append the created machine to the signal', () => {
      service.addMachine(mockDraft).subscribe(created => {
        expect(created).toEqual(mockMachine);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDraft);
      req.flush(mockMachine);

      expect(service.machines()).toEqual([mockMachine]);
    });

    it('should append to existing machines, not replace them', () => {
      const existing: Machine = { ...mockMachine, id: 99, name: 'Existing' };
      service.machines.set([existing]);

      service.addMachine(mockDraft).subscribe();

      const req = httpMock.expectOne(API_URL);
      req.flush(mockMachine);

      expect(service.machines()).toEqual([existing, mockMachine]);
    });
  });

  
});