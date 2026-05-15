import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>Clinical Report</h1>
        <p>Download a comprehensive PDF summarizing your AI screening results and mood history.</p>
      </div>

      <div class="card text-center fade-in-up" style="max-width:600px;margin:0 auto;padding:4rem 2rem">
        <div style="font-size:4rem;margin-bottom:1.5rem">📄</div>
        <h2 class="mb-3">Your Report is Ready</h2>
        <p class="text-muted mb-4">
          This report includes your latest symptom assessment, AI subtype classification, confidence metrics, top contributing factors, and a full table of your recent mood logs. It is formatted for easy sharing with your mental health professional.
        </p>

        <button (click)="downloadPdf()" class="btn btn-primary btn-lg" [disabled]="loading">
          {{ loading ? 'Generating PDF...' : '⬇️ Download PDF Report' }}
        </button>
      </div>
    </div>
  `
})
export class ReportComponent {
  auth = inject(AuthService);
  http = inject(HttpClient);
  notif = inject(NotificationService);
  loading = false;

  downloadPdf() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.loading = true;

    this.http.get(`/api/v1/reports/${user.id}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bipolarguide-report-${user.id.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.loading = false;
        this.notif.success('PDF downloaded successfully');
      },
      error: () => {
        this.notif.error('Failed to generate PDF. Make sure you have completed an assessment.');
        this.loading = false;
      }
    });
  }
}
