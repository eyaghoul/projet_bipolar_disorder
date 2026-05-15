import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-gate',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="gate-wrap">
      <div class="gate-content" [class.blurred]="!unlocked">
        <ng-content />
      </div>
      @if (!unlocked) {
        <div class="gate-overlay">
          <div class="gate-card">
            <div class="lock-icon">🔒</div>
            <h3>Premium Feature</h3>
            <p>{{ message }}</p>
            <a routerLink="/auth/upgrade" class="btn btn-primary btn-lg">
              Upgrade to Premium
            </a>
            <p class="gate-hint">$9.99/month · Cancel anytime</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gate-wrap { position: relative; }
    .gate-content { transition: filter 0.3s; }
    .gate-content.blurred { filter: blur(8px); pointer-events: none; user-select: none; }
    .gate-overlay {
      position: absolute; inset: 0; z-index: 10;
      display: flex; align-items: center; justify-content: center;
      background: rgba(13,27,42,0.6); border-radius: 20px;
      backdrop-filter: blur(4px);
    }
    .gate-card {
      text-align: center; padding: 2.5rem 2rem;
      background: rgba(22,32,50,0.95);
      border: 1px solid rgba(0,180,216,0.3);
      border-radius: 20px; max-width: 340px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,180,216,0.15);
    }
    .lock-icon { font-size: 3rem; margin-bottom: 1rem; }
    h3 { margin-bottom: 0.75rem; }
    p { color: #94a3b8; margin-bottom: 1.5rem; font-size: 0.9375rem; }
    .gate-hint { color: #64748b; font-size: 0.8125rem; margin-top: 0.75rem; margin-bottom: 0; }
  `],
})
export class PremiumGateComponent {
  @Input() unlocked = false;
  @Input() message = 'Upgrade to Premium to unlock this feature.';
}
