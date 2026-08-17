import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MachineService } from '../services/machine.services';
import { NotificationService } from '../services/notification.service';
import { MachineDraft } from '../models/machine.model';

@Component({
  selector: 'app-machine-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './machine-form.html',
  styleUrl: './machine-form.css'
})
export class MachineFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private machineService = inject(MachineService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  machineId: number | null = null;
  isEditMode = false;
  isSubmitting = signal(false);

  machineForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', Validators.required],
    launchYear: [null as number | null, [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear())]],
    status: ['active', Validators.required],
    unitPrice: [null as number | null, [Validators.required, Validators.min(1)]],
    specs: this.fb.group({
      width: [null as number | null, [Validators.required, Validators.min(0)]],
      speed: [null as number | null, [Validators.required, Validators.min(0)]],
      printColors: [null as number | null, [Validators.required, Validators.min(1)]]
    })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.machineId = Number(id);

      this.machineService.getMachine(this.machineId).subscribe({
        next: machine => this.machineForm.patchValue(machine),
        error: () => this.notification.error('Could not load machine details')
      });
    }
    
  }

  onSubmit(): void {
    if (this.machineForm.invalid) {
      this.machineForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.machineForm.getRawValue() as MachineDraft;

    const request$ = this.isEditMode
      ? this.machineService.updateMachine(this.machineId!, value)
      : this.machineService.addMachine(value);

    request$.subscribe({
      next: () => {
        this.notification.success(`Machine ${this.isEditMode ? 'updated' : 'added'}`);
        this.router.navigate(['/machines']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Something went wrong. Please try again.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/machines']);
  }
}