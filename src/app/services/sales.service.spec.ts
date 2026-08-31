import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SalesService } from './sales.service';
import { SalesRecord } from '../models/sales-record.model';

describe('SalesService', () => {
  let service: SalesService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:3000/salesRecords';

  const mockSales: SalesRecord[] = [
    { id: 1, machineId: 1, region: 'North', quantitySold: 3, revenue: 1500000, saleDate: '2025-06-01', dealerName: 'PackTech Distributors' },
    { id: 2, machineId: 2, region: 'South', quantitySold: 1, revenue: 2000000, saleDate: '2025-03-14', dealerName: 'Apex Packaging' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(SalesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty sales signal and isLoading false', () => {
    expect(service.sales()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  describe('loadSales', () => {
    it('should set isLoading to true when called', () => {
      service.loadSales();

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(API_URL);
      req.flush(mockSales);
    });

    it('should populate the sales signal and clear isLoading on success', () => {
      service.loadSales();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockSales);

      expect(service.sales()).toEqual(mockSales);
      expect(service.isLoading()).toBe(false);
    });

    it('should clear isLoading but leave sales unset on error', () => {
      service.loadSales();

      const req = httpMock.expectOne(API_URL);
      req.error(new ProgressEvent('Network error'));


      expect(service.sales()).toEqual([]);
      expect(service.isLoading()).toBe(false);
    });
  });
});