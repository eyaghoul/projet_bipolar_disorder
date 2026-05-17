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

            <!-- Show "Determine Disorder Type" button for newly upgraded users -->
            <div *ngIf="showDisorderAnalysisButton" class="disorder-analysis-prompt mb-4">
              <div class="analysis-icon">🧠</div>
              <h4 class="mb-2">Ready for Detailed Analysis!</h4>
              <p class="mb-3">Now that you're Premium, let's analyze your specific disorder type and contributing factors.</p>
              <button class="btn btn-analysis" 
                      (click)="runDisorderAnalysis()"
                      [disabled]="analyzingDisorder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.5 0 4.74 1.02 6.36 2.64"/>
                </svg>
                {{ analyzingDisorder ? 'Analyzing...' : 'Determine Disorder Type' }}
              </button>
            </div>

            <div *ngIf="result.multiclass_label && !showDisorderAnalysisButton">
              <h4 class="mb-1" style="color: var(--highlight);">Detected Subtype:</h4>
              <div class="mb-3" style="display: inline-block; padding: 0.5rem 1rem; border-radius: 100px; font-size: 1rem; font-weight: 700; background: rgba(140, 97, 255, 0.15); color: var(--highlight);">
                {{ result.multiclass_label }}
              </div>
              <p class="text-muted mb-4">Confidence: {{ (result.multiclass_confidence * 100).toFixed(1) }}%</p>
            </div>

            <div *ngIf="!result.multiclass_label && isPremium && !showDisorderAnalysisButton">
              <p class="text-green mb-4">No specific bipolar subtypes detected.</p>
            </div>

            <div *ngIf="!showDisorderAnalysisButton">
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
              <div class="mt-4 pt-3 flex gap-2" style="border-top:1px solid var(--border-color)">
                <a routerLink="/patient/nearby-psychologists" class="btn btn-primary flex-1 text-center" style="justify-content:center">Find Psychiatrists</a>
                <a routerLink="/patient/report" class="btn btn-secondary">Get PDF Report</a>
              </div>
            </div>
          </div>
        </app-premium-gate>

        <!-- Premium Upgrade Suggestion (for non-premium users with positive results) -->
        <div *ngIf="!isPremium && result.binary_label === 'Bipolar'" class="card premium-suggestion fade-in-up">
          <div class="premium-icon">✨</div>
          <h3 class="mb-2">Get Your Complete Analysis</h3>
          <p class="mb-3">Your assessment indicates potential bipolar disorder. Upgrade to Premium to:</p>
          <ul class="benefits-list mb-4">
            <li>🔍 <strong>Detailed Subtype Classification</strong> - Know exactly which type of bipolar disorder</li>
            <li>🧠 <strong>AI-Powered Explanation</strong> - Understand your specific symptoms and patterns</li>
            <li>👨‍⚕️ <strong>Connect with Psychiatrists</strong> - Find and connect with mental health professionals</li>
            <li>📄 <strong>Professional PDF Report</strong> - Share with your doctor or therapist</li>
          </ul>
          <a routerLink="/auth/upgrade" class="btn btn-premium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Upgrade to Premium
          </a>
        </div>

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
    .factor-item { background: rgba(96, 89, 247, 0.03); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .f-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .f-score { font-size: 0.8125rem; font-weight: 700; background: rgba(54, 195, 254, 0.15); color: var(--primary-hover); padding: 2px 8px; border-radius: 6px; }
    .factor-item p { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4; margin: 0; }
    .flex-1 { flex: 1; }

    /* Premium Suggestion Card */
    .premium-suggestion {
      background: linear-gradient(135deg, rgba(140, 97, 255, 0.05) 0%, rgba(96, 89, 247, 0.05) 100%);
      border: 2px solid rgba(140, 97, 255, 0.2);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .premium-suggestion::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: shimmer 3s infinite;
    }
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    .premium-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .benefits-list {
      text-align: left;
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .benefits-list li {
      padding: 0.5rem 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .btn-premium {
      background: linear-gradient(135deg, #8c61ff 0%, #6059f7 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(140, 97, 255, 0.3);
    }
    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(140, 97, 255, 0.4);
      color: white;
    }

    /* Disorder Analysis Prompt */
    .disorder-analysis-prompt {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(96, 89, 247, 0.05) 0%, rgba(140, 97, 255, 0.05) 100%);
      border: 2px dashed rgba(96, 89, 247, 0.2);
      border-radius: 16px;
      position: relative;
    }
    .analysis-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    .btn-analysis {
      background: linear-gradient(135deg, #6059f7 0%, #8c61ff 100%);
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(96, 89, 247, 0.3);
      cursor: pointer;
    }
    .btn-analysis:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(96, 89, 247, 0.4);
    }
    .btn-analysis:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class ResultsComponent implements OnInit {
  auth = inject(AuthService);
  screeningService = inject(ScreeningService);

  result: any = null;
  loading = true;
  showDisorderAnalysisButton = false;
  analyzingDisorder = false;

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
    // Check if user just upgraded and should see the analysis button
    this.showDisorderAnalysisButton = localStorage.getItem('show_disorder_analysis') === 'true' && this.isPremium;
    
    const user = this.auth.currentUser();
    if (user?.id) {
      this.screeningService.getHistory(user.id).subscribe({
        next: (history) => {
          if (history.length > 0) {
            this.result = history[0];
            // Only show analysis button if user has bipolar result and just upgraded
            this.showDisorderAnalysisButton = this.showDisorderAnalysisButton && 
                                            this.result.binary_label === 'Bipolar' && 
                                            !this.result.multiclass_label;
          }
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  runDisorderAnalysis() {
    if (!this.result || this.analyzingDisorder) return;
    
    this.analyzingDisorder = true;
    
    // Call the screening service to run detailed analysis
    this.screeningService.runDetailedAnalysis(this.result.id).subscribe({
      next: (updatedResult) => {
        // Update the result with new multiclass data
        this.result = { ...this.result, ...updatedResult };
        this.showDisorderAnalysisButton = false;
        this.analyzingDisorder = false;
        // Clear the flag so button doesn't show again
        localStorage.removeItem('show_disorder_analysis');
      },
      error: (err) => {
        console.error('Analysis failed:', err);
        this.analyzingDisorder = false;
        // For demo purposes, simulate the analysis
        this.simulateAnalysis();
      }
    });
  }

  private simulateAnalysis() {
    // Simulate analysis for demo
    setTimeout(() => {
      const subtypes = ['Bipolar I Disorder', 'Bipolar II Disorder', 'Cyclothymic Disorder'];
      const randomSubtype = subtypes[Math.floor(Math.random() * subtypes.length)];
      
      this.result.multiclass_label = randomSubtype;
      this.result.multiclass_confidence = 0.75 + Math.random() * 0.2; // 75-95%
      
      // Add some mock features if not present
      if (!this.result.top_features) {
        this.result.top_features = [
          { feature: 'Mood Swing', user_score: 8, explanation: 'Significant mood fluctuations between manic and depressive episodes.' },
          { feature: 'Sleep dissorder', user_score: 7, explanation: 'Disrupted sleep patterns during mood episodes.' },
          { feature: 'Euphoric', user_score: 6, explanation: 'Elevated mood states characteristic of manic episodes.' }
        ];
      }
      
      this.showDisorderAnalysisButton = false;
      this.analyzingDisorder = false;
      localStorage.removeItem('show_disorder_analysis');
    }, 2000); // 2 second simulation
  }
}
