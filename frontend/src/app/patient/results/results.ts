import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ScreeningService } from '../../core/services/screening.service';
import { ConfidenceGaugeComponent } from '../../shared/components/confidence-gauge/confidence-gauge';
import { PremiumGateComponent } from '../../shared/components/premium-gate/premium-gate';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfidenceGaugeComponent, PremiumGateComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header fade-in-up">
        <h1>Screening Results</h1>
        <p>AI-assisted analysis based on your recent assessment.</p>
      </div>

      <div *ngIf="loading" class="text-center mt-4">Loading results...</div>

      <div *ngIf="!loading && result" class="grid-2 fade-in-up">

        <!-- Primary Result Card -->
        <div class="card card-gradient">
          <h3 class="mb-3">Primary Diagnosis</h3>
          <div class="result-badge mb-3" [class.bipolar]="result.binary_label === 'Bipolar'">
            {{ result.binary_label }}
          </div>

          <div class="divider"></div>
          <app-confidence-gauge [score]="result.confidence" [type]="result.binary_label === 'Bipolar' ? 'high' : 'low'"></app-confidence-gauge>

          <div class="mt-4 text-center">
            <p class="text-muted" style="font-size:0.875rem">Assessed on {{ result.createdAt | date:'medium' }}</p>
            <a routerLink="/patient/questionnaire" class="btn btn-secondary mt-2">Retake Assessment</a>
          </div>
        </div>

        <!-- Premium Details Card -->
        <app-premium-gate [unlocked]="isPremium" message="Upgrade to see detailed subtype classification and AI explanation.">
          <div class="card" style="height:100%">
            <h3 class="mb-3">Detailed Analysis</h3>

            <div *ngIf="result.multiclass_label">
              <h4 class="text-indigo mb-1">Detected Subtype:</h4>
              <div class="badge badge-indigo mb-3" style="font-size:1rem;padding:0.5rem 1rem">
                {{ result.multiclass_label }}
              </div>
              <p class="text-muted mb-4">Confidence: {{ (result.multiclass_confidence * 100).toFixed(1) }}%</p>
            </div>

            <div *ngIf="!result.multiclass_label && isPremium">
              <p class="text-green mb-4">No specific bipolar subtypes detected.</p>
            </div>

            <h4 class="mb-2">Key Contributing Factors</h4>
            <div *ngIf="result.top_features?.length; else noFactors" class="factors-list">
              <div *ngFor="let f of result.top_features" class="factor-item">
                <div class="f-header">
                  <strong>{{ getFeatureName(f.feature) }}</strong>
                  <span class="f-score">Score: {{ f.user_score }}/10</span>
                </div>
                <p>{{ f.explanation }}</p>
              </div>
            </div>
            <ng-template #noFactors><p class="text-muted">No prominent risk factors highlighted.</p></ng-template>

            <!-- Premium Actions -->
            <div class="mt-4 pt-3 flex gap-2" style="border-top:1px solid var(--border)">
              <a routerLink="/patient/nearby-psychologists" class="btn btn-primary flex-1 text-center" style="justify-content:center">Find Providers</a>
              <a routerLink="/patient/report" class="btn btn-secondary">Get PDF Report</a>
            </div>
          </div>
        </app-premium-gate>

      </div>

      <div *ngIf="!loading && !result" class="card text-center mt-4 fade-in-up">
        <h3 class="mb-2">No results yet</h3>
        <p class="text-muted mb-3">You haven't completed a symptom assessment yet.</p>
        <a routerLink="/patient/questionnaire" class="btn btn-primary">Take Assessment</a>
      </div>
    </div>
  `,
  styles: [`
    .result-badge {
      display: inline-block; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-size: 1.5rem; font-weight: 800;
      background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3);
    }
    .result-badge.bipolar {
      background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3);
    }
    .factors-list { display: flex; flex-direction: column; gap: 1rem; }
    .factor-item { background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .f-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .f-score { font-size: 0.8125rem; font-weight: 700; background: rgba(0,180,216,0.15); color: #00b4d8; padding: 2px 8px; border-radius: 6px; }
    .factor-item p { font-size: 0.875rem; color: #94a3b8; line-height: 1.4; margin: 0; }
    .flex-1 { flex: 1; }
  `]
})
export class ResultsComponent implements OnInit {
  auth = inject(AuthService);
  screeningService = inject(ScreeningService);

  result: any = null;
  loading = true;

  get isPremium() { return this.auth.isPremium(); }

  FEATURE_MAP: Record<string, string> = {
    'Sadness': 'Sadness',
    'Euphoric': 'Euphoria',
    'Exhausted': 'Exhaustion',
    'Sleep dissorder': 'Sleep Disorder',
    'Mood Swing': 'Mood Swings',
    'Suicidal thoughts': 'Suicidal Thoughts',
    'Anorxia': 'Appetite Changes',
    'Aggressive Response': 'Aggression',
    'Nervous Break-down': 'Nervous Breakdown',
    'Admit Mistakes': 'Self-Awareness',
    'Overthinking': 'Racing Thoughts',
    'Sexual Activity': 'Sexual Interest',
    'Concentration': 'Focus/Concentration',
    'Optimisim': 'Optimism Level'
  };

  getFeatureName(key: string): string {
    return this.FEATURE_MAP[key] || key;
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.id) {
      this.screeningService.getHistory(user.id).subscribe({
        next: (history) => {
          if (history.length > 0) this.result = history[0];
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }
}
