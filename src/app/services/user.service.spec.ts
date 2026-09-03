import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { User } from '../models/user.model';

describe.only('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:3000/users';

  const mockUser: User = {
    id: 1,
    username: 'monark',
    password: '123456',
    role: 'employee',
    fullName: 'Monark Bhardwaj',
    email: 'monark@test.com',
    department: 'IT',
    dateJoined: '2026-01-01',
    status: 'active'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findByUsername', () => {
    it('should GET users filtered by username', () => {
      service.findByUsername('monark').subscribe(users => {
        expect(users).toEqual([mockUser]);
      });

      const req = httpMock.expectOne(`${API_URL}?username=monark`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });

    it('should return an empty array when no user matches', () => {
      service.findByUsername('nobody').subscribe(users => {
        expect(users).toEqual([]);
      });

      const req = httpMock.expectOne(`${API_URL}?username=nobody`);
      req.flush([]);
    });
  });

  describe('getAllUsers', () => {
    it('should GET all users with no query params', () => {
      service.getAllUsers().subscribe(users => {
        expect(users).toEqual([mockUser]);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });
  });

  describe('register', () => {
    it('should POST a new user without an id', () => {
      const newUser: Omit<User, 'id'> = {
        username: 'newperson',
        password: 'abc123',
        role: 'employee',
        fullName: 'New Person',
        email: 'new@test.com',
        department: 'HR',
        dateJoined: '2026-01-01',
        status: 'active'
      };

      service.register(newUser).subscribe(created => {
        expect(created).toEqual({ ...newUser, id: 5 });
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush({ ...newUser, id: 5 });
    });
  });

  describe('updateUserStatus', () => {
    it('should PATCH only the status field', () => {
      service.updateUserStatus(1, 'inactive').subscribe(updated => {
        expect(updated.status).toBe('inactive');
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'inactive' });
      req.flush({ ...mockUser, status: 'inactive' });
    });
  });

  describe('isUsernameTaken', () => {
    it('should return true when a matching user exists', () => {
      service.isUsernameTaken('monark').subscribe(taken => {
        expect(taken).toBe(true);
      });

      const req = httpMock.expectOne(`${API_URL}?username=monark`);
      req.flush([mockUser]);
    });

    it('should return false when no matching user exists', () => {
      service.isUsernameTaken('freeusername').subscribe(taken => {
        expect(taken).toBe(false);
      });

      const req = httpMock.expectOne(`${API_URL}?username=freeusername`);
      req.flush([]);
    });
  });
});