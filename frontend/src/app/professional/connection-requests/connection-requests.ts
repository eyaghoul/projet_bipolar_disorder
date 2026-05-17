import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionService, Connection } from '../../core/services/connection.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-connection-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>Connection Requests</h1>
        <p>Manage incoming requests from patients.</p>
      </div>

      <div class="card fade-in-up">
        <h3 class="mb-4">Pending Requests</h3>
        
        <div *ngIf="loading" class="text-center text-muted">Loading requests...</div>
        
        <div *ngIf="!loading && requests.length === 0" class="text-center text-muted py-4">
          No pending requests at this time.
        </div>

        <div class="request-list" *ngIf="!loading && requests.length > 0">
          <div *ngFor="let req of requests" class="request-item">
            <div class="req-info">
              <h4>{{ req.patient_name || 'Unknown Patient' }}</h4>
              <p class="text-muted text-sm">Requested on: {{ req.requested_at | date:'mediumDate' }}</p>
              <p *ngIf="req.message" class="req-msg">"{{ req.message }}"</p>
            </div>
            <div class="req-actions">
              <button class="btn btn-primary btn-sm" (click)="approve(req)">Approve</button>
              <button class="btn btn-secondary btn-sm" (click)="reject(req)">Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .request-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem; border: 1px solid var(--border-color);
      border-radius: 12px; margin-bottom: 1rem; background: var(--bg-dark);
    }
    .req-info h4 { margin: 0 0 0.25rem 0; }
    .req-msg { margin: 0.75rem 0 0 0; font-style: italic; color: var(--text-secondary); background: rgba(96, 89, 247, 0.04); padding: 0.75rem; border-radius: 8px; border-left: 3px solid var(--primary); }
    .req-actions { display: flex; gap: 0.75rem; }
  `]
})
export class ConnectionRequestsComponent implements OnInit {
  connSvc = inject(ConnectionService);
  notif = inject(NotificationService);
  
  requests: Connection[] = [];
  loading = true;

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.connSvc.getMyRequests().subscribe({
      next: (data) => {
        this.requests = data.filter(r => r.status === 'pending');
        this.loading = false;
      },
      error: () => {
        this.notif.error('Failed to load connection requests');
        this.loading = false;
      }
    });
  }

  approve(req: Connection) {
    this.connSvc.approveConnection(req.id).subscribe({
      next: () => {
        this.notif.success('Connection approved');
        this.requests = this.requests.filter(r => r.id !== req.id);
      },
      error: (e) => this.notif.error(e.error?.detail || 'Failed to approve connection')
    });
  }

  reject(req: Connection) {
    this.connSvc.rejectConnection(req.id).subscribe({
      next: () => {
        this.notif.warning('Connection rejected');
        this.requests = this.requests.filter(r => r.id !== req.id);
      },
      error: (e) => this.notif.error(e.error?.detail || 'Failed to reject connection')
    });
  }
}
