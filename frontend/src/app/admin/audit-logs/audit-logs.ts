import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>Audit Logs</h1>
        <p>System access and activity records for compliance oversight.</p>
      </div>

      <div class="table-wrap fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Target ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs">
              <td class="text-muted" style="white-space:nowrap">{{ log.timestamp | date:'medium' }}</td>
              <td class="font-bold">{{ log.userEmail }}</td>
              <td><div class="badge badge-indigo">{{ log.action }}</div></td>
              <td>{{ log.targetResource }}</td>
              <td class="text-muted" style="font-size:0.8rem;font-family:monospace">{{ log.targetId | slice:0:8 }}...</td>
              <td class="text-muted" style="font-size:0.8rem">{{ log.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  svc = inject(AdminService);
  logs: any[] = [];
  ngOnInit() { this.svc.getAuditLogs(100).subscribe(res => this.logs = res); }
}
