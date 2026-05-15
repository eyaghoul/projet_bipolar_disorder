import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ScreeningService } from '../../core/services/screening.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header text-center fade-in-up">
        <h1>Symptom Assessment</h1>
        <p>Complete this clinical questionnaire for AI-assisted analysis.</p>
      </div>

      <!-- Progress bar -->
      <div class="progress-wrap fade-in-up">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="(step / totalSteps) * 100"></div>
        </div>
        <div class="progress-labels">
          <span [class.active]="step >= 1">Mood & Energy</span>
          <span [class.active]="step >= 2">Behavior</span>
          <span [class.active]="step >= 3">Symptoms</span>
        </div>
      </div>

      <div class="card fade-in-up" style="max-width: 700px; margin: 0 auto;">
        <!-- Step 1 -->
        <div *ngIf="step === 1" class="step-content">
          <div class="q-group">
            <label>1. How often do you feel deep sadness?</label>
            <div class="slider-wrap">
              <input type="range" min="0" max="10" [(ngModel)]="answers['Sadness']" />
              <div class="val">{{ answers['Sadness'] }}</div>
            </div>
            <div class="slider-labels"><span>Never</span><span>Constant</span></div>
          </div>
          <div class="q-group">
            <label>2. How often do you feel unusually euphoric or on top of the world?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Euphoric']" /><div class="val">{{ answers['Euphoric'] }}</div></div>
          </div>
          <div class="q-group">
            <label>3. How often do you feel mentally or physically exhausted?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Exhausted']" /><div class="val">{{ answers['Exhausted'] }}</div></div>
          </div>
          <div class="q-group">
            <label>4. How frequently do your moods shift dramatically?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Mood Swing']" /><div class="val">{{ answers['Mood Swing'] }}</div></div>
          </div>
          <div class="q-group">
            <label>5. How would you rate your overall sense of optimism?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Optimisim']" /><div class="val">{{ answers['Optimisim'] }}</div></div>
          </div>
        </div>

        <!-- Step 2 -->
        <div *ngIf="step === 2" class="step-content">
          <div class="q-group">
            <label>6. How often do you react aggressively to situations?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Aggressive Response']" /><div class="val">{{ answers['Aggressive Response'] }}</div></div>
          </div>
          <div class="q-group">
            <label>7. How often do racing thoughts or overthinking affect you?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Overthinking']" /><div class="val">{{ answers['Overthinking'] }}</div></div>
          </div>
          <div class="q-group">
            <label>8. How well are you able to concentrate on tasks?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Concentration']" /><div class="val">{{ answers['Concentration'] }}</div></div>
            <div class="slider-labels"><span>Very Poor</span><span>Excellent</span></div>
          </div>
          <div class="q-group">
            <label>9. How easily can you admit your own mistakes?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Admit Mistakes']" /><div class="val">{{ answers['Admit Mistakes'] }}</div></div>
            <div class="slider-labels"><span>Never</span><span>Always</span></div>
          </div>
          <div class="q-group">
            <label>10. How would you rate your level of sexual interest/activity?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Sexual Activity']" /><div class="val">{{ answers['Sexual Activity'] }}</div></div>
          </div>
        </div>

        <!-- Step 3 -->
        <div *ngIf="step === 3" class="step-content">
          <div class="q-group">
            <label>11. How severely does sleep disturbance affect you?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Sleep dissorder']" /><div class="val">{{ answers['Sleep dissorder'] }}</div></div>
          </div>
          <div class="q-group">
            <label>12. How often do you experience thoughts of self-harm or suicide?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Suicidal thoughts']" /><div class="val">{{ answers['Suicidal thoughts'] }}</div></div>
          </div>
          <div class="q-group">
            <label>13. How often do you experience changes in appetite or disordered eating?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Anorxia']" /><div class="val">{{ answers['Anorxia'] }}</div></div>
          </div>
          <div class="q-group">
            <label>14. How frequently do you feel on the verge of a breakdown?</label>
            <div class="slider-wrap"><input type="range" min="0" max="10" [(ngModel)]="answers['Nervous Break-down']" /><div class="val">{{ answers['Nervous Break-down'] }}</div></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between mt-4 pt-3" style="border-top:1px solid rgba(255,255,255,0.1)">
          <button class="btn btn-secondary" (click)="step = step - 1" [disabled]="step === 1 || loading">Back</button>
          <button class="btn btn-primary" (click)="nextStep()" [disabled]="loading">
            <span *ngIf="step < totalSteps">Next Step</span>
            <span *ngIf="step === totalSteps">{{ loading ? 'Analyzing...' : 'Submit Assessment' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .progress-wrap { max-width: 700px; margin: 0 auto 2.5rem; }
    .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #00b4d8, #6366f1); transition: width 0.4s ease; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.8125rem; color: #64748b; font-weight: 500; }
    .progress-labels span.active { color: #00b4d8; }
    .q-group { margin-bottom: 2rem; }
    .q-group label { display: block; font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #f0f8ff; }
    .slider-wrap { display: flex; align-items: center; gap: 1rem; }
    .val { width: 32px; height: 32px; border-radius: 8px; background: rgba(0,180,216,0.15); color: #00b4d8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .slider-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; padding-right: 48px; text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class QuestionnaireComponent {
  step = 1;
  totalSteps = 3;
  loading = false;
  screeningService = inject(ScreeningService);
  notif = inject(NotificationService);
  router = inject(Router);

  answers: Record<string, number> = {
    'Sadness': 5, 'Euphoric': 5, 'Exhausted': 5, 'Sleep dissorder': 5,
    'Mood Swing': 5, 'Suicidal thoughts': 0, 'Anorxia': 5, 'Aggressive Response': 5,
    'Nervous Break-down': 5, 'Admit Mistakes': 5, 'Overthinking': 5,
    'Sexual Activity': 5, 'Concentration': 5, 'Optimisim': 5
  };

  nextStep() {
    if (this.step < this.totalSteps) {
      this.step++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.submit();
    }
  }

  submit() {
    this.loading = true;
    this.screeningService.runScreening(this.answers).subscribe({
      next: (res) => {
        this.notif.success('Assessment complete');
        this.router.navigate(['/patient/results']);
      },
      error: (e) => {
        this.notif.error('Error running assessment');
        this.loading = false;
      }
    });
  }
}
