import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confidence-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gauge-wrap">
      <svg viewBox="0 0 100 50" class="gauge-svg">
        <path class="gauge-bg" d="M 10 50 A 40 40 0 0 1 90 50" />
        <path class="gauge-val" d="M 10 50 A 40 40 0 0 1 90 50"
              [style.stroke-dasharray]="dashArray"
              [style.stroke-dashoffset]="dashOffset"
              [style.stroke]="color" />
      </svg>
      <div class="gauge-text">
        <div class="gauge-pct" [style.color]="color">{{ (score * 100).toFixed(1) }}%</div>
        <div class="gauge-lbl">AI Confidence</div>
      </div>
    </div>
  `,
  styles: [`
    .gauge-wrap { position: relative; width: 160px; height: 90px; margin: 0 auto; }
    .gauge-svg { width: 100%; height: 100%; overflow: visible; }
    .gauge-bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 8; stroke-linecap: round; }
    .gauge-val { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1s ease-out, stroke 0.3s; }
    .gauge-text { position: absolute; bottom: 0; left: 0; right: 0; text-align: center; }
    .gauge-pct { font-size: 1.5rem; font-weight: 800; line-height: 1; }
    .gauge-lbl { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
  `]
})
export class ConfidenceGaugeComponent {
  @Input() score = 0; // 0 to 1
  @Input() type: 'high' | 'low' = 'high';

  get dashArray() { return Math.PI * 40; }
  get dashOffset() { return this.dashArray * (1 - this.score); }
  get color() { return this.type === 'high' ? '#00b4d8' : '#22c55e'; }
}
