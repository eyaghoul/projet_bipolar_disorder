import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { MoodService } from '../../core/services/mood.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PremiumGateComponent } from '../../shared/components/premium-gate/premium-gate';

Chart.register(...registerables);

@Component({
  selector: 'app-mood-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumGateComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>Mood Tracker</h1>
        <p>Log your daily mood, sleep, energy, and irritability to track patterns.</p>
      </div>

      <div class="grid-2 fade-in-up">
        <!-- Log Form -->
        <div class="card">
          <h3 class="mb-4">Daily Entry</h3>
          <form (ngSubmit)="submitLog()">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-control" [(ngModel)]="log.date" name="date" required />
            </div>

            <div class="form-group">
              <label class="form-label">Mood (1-10) — 1: Depressed, 10: Manic</label>
              <div class="flex items-center gap-2">
                <input type="range" min="1" max="10" [(ngModel)]="log.mood" name="mood" style="flex:1" />
                <span class="val-badge">{{ log.mood }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Sleep (hours)</label>
              <div class="flex items-center gap-2">
                <input type="range" min="0" max="24" step="0.5" [(ngModel)]="log.sleep" name="sleep" style="flex:1" />
                <span class="val-badge">{{ log.sleep }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Energy Level (1-10)</label>
              <div class="flex items-center gap-2">
                <input type="range" min="1" max="10" [(ngModel)]="log.energy" name="energy" style="flex:1" />
                <span class="val-badge">{{ log.energy }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes (optional)</label>
              <textarea class="form-control" [(ngModel)]="log.notes" name="notes" placeholder="Any specific triggers today?" style="min-height: 80px;"></textarea>
            </div>

            <button type="submit" class="btn btn-primary w-full mt-2" [disabled]="loading">
              {{ loading ? 'Saving...' : 'Save Entry' }}
            </button>
          </form>
        </div>

        <!-- Chart Area -->
        <div>
          <app-premium-gate [unlocked]="isPremium" message="Upgrade to Premium to unlock 30-day and 90-day mood analytics.">
            <div class="card" style="height:100%">
              <div class="flex justify-between items-center mb-4">
                <h3>Mood History</h3>
                <select class="form-control" style="width:auto; padding: 4px 8px; font-size: 13px;" (change)="updateChart()" [(ngModel)]="daysView">
                  <option [value]="7">Last 7 Days</option>
                  <option [value]="30" *ngIf="isPremium">Last 30 Days</option>
                  <option [value]="90" *ngIf="isPremium">Last 90 Days</option>
                </select>
              </div>

              <div class="chart-container" style="position: relative; height: 350px; width: 100%;">
                <canvas #moodChart></canvas>
              </div>
            </div>
          </app-premium-gate>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .val-badge { 
      width: 40px; height: 40px; border-radius: 8px; 
      background: var(--input-bg); color: var(--primary); border: 1px solid var(--border-color);
      display: flex; align-items: center; justify-content: center; 
      font-weight: 700; flex-shrink: 0; 
    }
    input[type="range"] {
      accent-color: var(--primary);
    }
  `]
})
export class MoodTrackerComponent implements OnInit {
  @ViewChild('moodChart', { static: false }) chartRef!: ElementRef;
  chart: any;

  auth = inject(AuthService);
  moodService = inject(MoodService);
  notif = inject(NotificationService);

  loading = false;
  logs: any[] = [];
  daysView = 7;

  get isPremium() { return this.auth.isPremium(); }

  log = {
    date: new Date().toISOString().split('T')[0],
    mood: 5,
    sleep: 7,
    energy: 5,
    irritability: 2,
    notes: ''
  };

  ngOnInit() {
    this.daysView = 7;
    this.loadLogs();
  }

  loadLogs() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.moodService.getLogs(user.id).subscribe({
      next: (data) => {
        this.logs = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setTimeout(() => this.updateChart(), 100);
      }
    });
  }

  submitLog() {
    this.loading = true;
    this.moodService.createLog(this.log).subscribe({
      next: () => {
        this.notif.success('Log saved successfully');
        this.loading = false;
        this.log.notes = ''; 
        this.loadLogs();
      },
      error: () => {
        this.notif.error('Failed to save log');
        this.loading = false;
      }
    });
  }

  updateChart() {
    if (!this.chartRef) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.daysView);
    const filteredLogs = this.logs.filter(l => new Date(l.date) >= cutoffDate);

    const labels = filteredLogs.map(l => l.date);
    const moodData = filteredLogs.map(l => l.mood);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Mood',
            data: moodData,
            borderColor: '#6059f7',
            backgroundColor: 'rgba(96, 89, 247, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#6059f7',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#1a1a2e', font: { size: 12 } } }
        },
        scales: {
          y: {
            min: 0, max: 10,
            grid: { color: 'rgba(208, 217, 240, 0.6)' },
            ticks: { color: '#4a5568' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#4a5568' }
          }
        }
      }
    });
  }
}
