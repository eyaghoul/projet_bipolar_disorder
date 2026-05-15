import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-model-monitoring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper" *ngIf="stats">
      <div class="page-header fade-in-up">
        <h1>Model Monitoring</h1>
        <p>Overview of AI screening distribution and professional feedback corrections.</p>
      </div>

      <div class="grid-4 mb-4 fade-in-up">
        <div class="card card-sm text-center">
          <div class="text-muted mb-1" style="font-size:0.875rem">Total Screenings</div>
          <h2>{{ stats.total_screenings }}</h2>
        </div>
        <div class="card card-sm text-center">
          <div class="text-muted mb-1" style="font-size:0.875rem">Feedback Items</div>
          <h2>{{ stats.total_feedback }}</h2>
        </div>
        <div class="card card-sm text-center">
          <div class="text-muted mb-1" style="font-size:0.875rem">Corrections Made</div>
          <h2>{{ stats.corrections }}</h2>
        </div>
        <div class="card card-sm text-center">
          <div class="text-muted mb-1" style="font-size:0.875rem">Correction Rate</div>
          <h2 [class.text-red]="stats.correction_rate > 0.15">{{ (stats.correction_rate * 100).toFixed(1) }}%</h2>
        </div>
      </div>

      <div class="grid-2 fade-in-up">
        <div class="card">
          <h3 class="mb-4">Binary Distribution</h3>
          <div style="height:250px;position:relative"><canvas #binaryChart></canvas></div>
        </div>
        <div class="card">
          <h3 class="mb-4">Subtype Distribution (Premium)</h3>
          <div style="height:250px;position:relative"><canvas #multiChart></canvas></div>
        </div>
      </div>
    </div>
  `
})
export class ModelMonitoringComponent implements OnInit {
  @ViewChild('binaryChart') binaryRef!: ElementRef;
  @ViewChild('multiChart') multiRef!: ElementRef;

  svc = inject(AdminService);
  stats: any = null;

  ngOnInit() {
    this.svc.getModelStats().subscribe(res => {
      this.stats = res;
      setTimeout(() => this.drawCharts(), 100);
    });
  }

  drawCharts() {
    new Chart(this.binaryRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Bipolar', 'Not Bipolar'],
        datasets: [{
          data: [this.stats.binary_distribution['Bipolar'], this.stats.binary_distribution['Not Bipolar']],
          backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(34,197,94,0.7)'],
          borderColor: ['#ef4444', '#22c55e'],
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#f0f8ff' } } } }
    });

    new Chart(this.multiRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Type I', 'Type II', 'Depressive'],
        datasets: [{
          label: 'Count',
          data: [
            this.stats.multiclass_distribution['Bipolar Type I'] || 0,
            this.stats.multiclass_distribution['Bipolar Type II'] || 0,
            this.stats.multiclass_distribution['Depressive Episode'] || 0
          ],
          backgroundColor: 'rgba(99,102,241,0.5)',
          borderColor: '#6366f1',
          borderWidth: 1
        }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false, 
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } }
      }
    });
  }
}
