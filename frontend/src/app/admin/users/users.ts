import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>User Management</h1>
        <p>Administer accounts, roles, plans, and access status.</p>
      </div>

      <div class="card mb-4 fade-in-up">
        <div class="flex gap-2">
          <select class="form-control" style="width:200px" [(ngModel)]="filters.role" (change)="load()">
            <option value="">All Roles</option>
            <option value="patient">Patients</option>
            <option value="professional">Professionals</option>
            <option value="admin">Admins</option>
          </select>
          <select class="form-control" style="width:200px" [(ngModel)]="filters.plan" (change)="load()">
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
          <select class="form-control" style="width:200px" [(ngModel)]="filters.status" (change)="load()">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div class="table-wrap fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td class="font-bold">{{ u.name }}</td>
              <td class="text-muted">{{ u.email }}</td>
              <td>
                <select class="form-control" style="padding:0.25rem;width:120px" [(ngModel)]="u.role" (change)="update(u, {role: u.role})">
                  <option value="patient">Patient</option>
                  <option value="professional">Professional</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <select class="form-control" style="padding:0.25rem;width:100px" [(ngModel)]="u.plan" (change)="update(u, {plan: u.plan})" [disabled]="u.role !== 'patient'">
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </td>
              <td>
                <select class="form-control" style="padding:0.25rem;width:110px" [(ngModel)]="u.status" (change)="update(u, {status: u.status})">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </td>
              <td>
                <button class="btn btn-danger btn-sm" (click)="deleteUser(u.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  svc = inject(AdminService);
  notif = inject(NotificationService);
  
  users: any[] = [];
  filters = { role: '', plan: '', status: '' };

  ngOnInit() { this.load(); }

  load() {
    this.svc.getUsers(this.filters).subscribe(res => this.users = res);
  }

  update(user: any, changes: any) {
    this.svc.updateUser(user.id, changes).subscribe({
      next: () => this.notif.success('User updated'),
      error: () => { this.notif.error('Failed to update'); this.load(); } // reload on error
    });
  }

  deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    this.svc.deleteUser(id).subscribe({
      next: () => {
        this.notif.success('User deleted');
        this.users = this.users.filter(u => u.id !== id);
      }
    });
  }
}
