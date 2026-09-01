import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect } from 'vitest';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MachineFormComponent } from './machine-form';
import { MachineService } from '../services/machine.services';
import { NotificationService } from '../services/notification.service';
import { Machine, MachineDraft } from '../models/machine.model';

describe('MachineFormComponent', () => {
  let machineServiceMock: {
    getMachine: ReturnType<typeof vi.fn>;
    addMachine: ReturnType<typeof vi.fn>;
    updateMachine: ReturnType<typeof vi.fn>;
  };
  let notificationMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockMachine: Machine = {
    id: 5,
    name: 'AlphaFlex',
    category: 'Flexo Press',
    launchYear: 2020,
    status: 'active',
    unitPrice: 500000,
    specs: { width: 1200, speed: 400, printColors: 8 }
  };

  const validDraft: MachineDraft = {
    name: 'HelioStar',
    category: 'Extrusion',
    launchYear: 2024,
    status: 'active',
    unitPrice: 100000,
    specs: { width: 500, speed: 300, printColors: 4 }
  };


  function setup(routeId: string | null) {
    machineServiceMock = {
      getMachine: vi.fn().mockReturnValue(of(mockMachine)),
      addMachine: vi.fn().mockReturnValue(of(mockMachine)),
      updateMachine: vi.fn().mockReturnValue(of(mockMachine))
    };
    notificationMock = { success: vi.fn(), error: vi.fn() };
    routerMock = { navigate: vi.fn() };

    const activatedRouteMock = {
      snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) }
    };

    TestBed.configureTestingModule({
      imports: [MachineFormComponent],
      providers: [
        { provide: MachineService, useValue: machineServiceMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    });

    const fixture = TestBed.createComponent(MachineFormComponent);
    fixture.detectChanges(); 
    return fixture;
  }

  function fillValidForm(fixture: ReturnType<typeof setup>) {
    fixture.componentInstance.machineForm.setValue({
      name: validDraft.name,
      category: validDraft.category,
      launchYear: validDraft.launchYear,
      status: validDraft.status,
      unitPrice: validDraft.unitPrice,
      specs: validDraft.specs
    });
  }

  it('should create', () => {
    const fixture = setup(null);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('ngOnInit — add (no route param)', () => {
    it('should stay in add mode and not call getMachine', () => {
      const fixture = setup(null);
      const component = fixture.componentInstance;

      expect(component.isEditMode).toBe(false);
      expect(component.machineId).toBeNull();
      expect(machineServiceMock.getMachine).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit — edit (route param present)', () => {
    it('should switch to edit mode and fetch the machine by id', () => {
      const fixture = setup('5');
      const component = fixture.componentInstance;

      expect(component.isEditMode).toBe(true);
      expect(component.machineId).toBe(5);
      expect(machineServiceMock.getMachine).toHaveBeenCalledWith(5);
    });

    it('should patch the form with the fetched machine data', () => {
      const fixture = setup('5');
      const formValue = fixture.componentInstance.machineForm.getRawValue();

      expect(formValue.name).toBe(mockMachine.name);
      expect(formValue.specs?.printColors).toBe(mockMachine.specs.printColors);
    });

    it('should show an error notification if the machine fails to load', () => {
      machineServiceMock.getMachine = vi.fn().mockReturnValue(throwError(() => new Error('not found')));

      TestBed.resetTestingModule();
      notificationMock = { success: vi.fn(), error: vi.fn() };
      routerMock = { navigate: vi.fn() };

      TestBed.configureTestingModule({
        imports: [MachineFormComponent],
        providers: [
          { provide: MachineService, useValue: machineServiceMock },
          { provide: NotificationService, useValue: notificationMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } }
        ]
      });

      const fixture = TestBed.createComponent(MachineFormComponent);
      fixture.detectChanges();

      expect(notificationMock.error).toHaveBeenCalledWith('Could not load machine details');
    });
  });

  describe('onSubmit — invalid form', () => {
    it('should mark all fields touched and call neither addMachine nor updateMachine', () => {
      const fixture = setup(null);
      fixture.componentInstance.onSubmit();

      expect(fixture.componentInstance.machineForm.get('name')?.touched).toBe(true);
      expect(machineServiceMock.addMachine).not.toHaveBeenCalled();
      expect(machineServiceMock.updateMachine).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit — valid form, add mode', () => {
    it('should call addMachine with the form value, show success, and navigate', () => {
      const fixture = setup(null);
      fillValidForm(fixture);

      fixture.componentInstance.onSubmit();

      expect(machineServiceMock.addMachine).toHaveBeenCalledWith(validDraft);
      expect(machineServiceMock.updateMachine).not.toHaveBeenCalled();
      expect(notificationMock.success).toHaveBeenCalledWith('Machine added');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/machines']);
    });
  });

  describe('onSubmit — valid form, edit mode', () => {
    it('should call updateMachine with the machine id and form value', () => {
      const fixture = setup('5');
      fillValidForm(fixture);

      fixture.componentInstance.onSubmit();

      expect(machineServiceMock.updateMachine).toHaveBeenCalledWith(5, validDraft);
      expect(machineServiceMock.addMachine).not.toHaveBeenCalled();
      expect(notificationMock.success).toHaveBeenCalledWith('Machine updated');
    });
  });

  describe('onSubmit — request fails', () => {
    it('should reset isSubmitting() and show an error, without navigating', () => {
      const fixture = setup(null);
      fillValidForm(fixture);
      machineServiceMock.addMachine.mockReturnValue(throwError(() => new Error('server error')));

      fixture.componentInstance.onSubmit();

      expect(fixture.componentInstance.isSubmitting()).toBe(false);
      expect(notificationMock.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should navigate to /machines without submitting', () => {
      const fixture = setup(null);
      fixture.componentInstance.cancel();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/machines']);
      expect(machineServiceMock.addMachine).not.toHaveBeenCalled();
    });
  });
});