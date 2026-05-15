import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PatientsService } from '../../core/services/patients.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header flex justify-between items-center fade-in-up">
        <div>
          <h1>Patient Directory</h1>
          <p>Search and manage your assigned patients.</p>
        </div>
        <div class="search-box">
          <input type="text" class="form-control" placeholder="Search patients..." [(ngModel)]="search" (keyup.enter)="load()" />
          <button class="btn btn-secondary" (click)="load()">Search</button>
        </div>
      </div>

      <div class="table-wrap fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Enrolled</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of patients">
              <td class="font-bold">{{ p.name }}</td>
              <td class="text-muted">{{ p.email }}</td>
              <td>
                <div class="badge" [class.badge-green]="p.status === 'active'" [class.badge-red]="p.status !== 'active'">
                  {{ p.status }}
                </div>
              </td>
              <td>
                <div class="badge" [class.badge-premium]="p.plan === 'premium'" [class.badge-free]="p.plan === 'free'">
                  {{ p.plan === 'premium' ? '⭐ Premium' : 'Free' }}
                </div>
              </td>
              <td class="text-muted">{{ p.createdAt | date }}</td>
              <td>
                <a [routerLink]="['/professional/patient', p.id]" class="btn btn-primary btn-sm">View Chart</a>
              </td>
            </tr>
            <tr *ngIf="patients.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No patients found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .search-box { display: flex; gap: 0.5rem; }
    .search-box input { width: 300px; }
  `]
})
export class PatientsComponent implements OnInit {
  svc = inject(PatientsService);
  patients: any[] = [];
  search = '';

  ngOnInit() { this.load(); }
  
  load() {
    this.svc.list(this.search).subscribe(res => this.patients = res);
  }
}
