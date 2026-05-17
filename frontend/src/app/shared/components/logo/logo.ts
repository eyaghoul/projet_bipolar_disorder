import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-wrap" [style.width.px]="size" [style.height.px]="size">
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 120 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BipolarGuide logo"
        role="img"
      >
        <defs>
          <!-- Left half gradient: cyan → blue -->
          <linearGradient id="gradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="#36c3fe" />
            <stop offset="100%" stop-color="#6059f7" />
          </linearGradient>
          <!-- Right half gradient: blue → purple -->
          <linearGradient id="gradRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="#6059f7" />
            <stop offset="100%" stop-color="#8c61ff" />
          </linearGradient>
          <!-- Clip for left brain half -->
          <clipPath id="clipLeft">
            <rect x="0" y="0" width="60" height="110" />
          </clipPath>
          <!-- Clip for right brain half -->
          <clipPath id="clipRight">
            <rect x="60" y="0" width="60" height="110" />
          </clipPath>
        </defs>

        <!-- ── Brain shape (full, clipped into two halves) ── -->
        <!-- Left half (blue/cyan) -->
        <g clip-path="url(#clipLeft)">
          <path
            d="
              M60 18
              C60 18 52 10 42 10
              C30 10 20 18 18 28
              C14 30 10 36 10 44
              C8  50 10 58 14 63
              C12 68 13 74 17 78
              C20 84 27 87 34 86
              C38 88 44 90 48 88
              C52 90 56 90 60 88
              L60 18 Z
            "
            fill="url(#gradLeft)"
          />
        </g>

        <!-- Right half (purple/blue) -->
        <g clip-path="url(#clipRight)">
          <path
            d="
              M60 18
              C60 18 68 10 78 10
              C90 10 100 18 102 28
              C106 30 110 36 110 44
              C112 50 110 58 106 63
              C108 68 107 74 103 78
              C100 84 93 87 86 86
              C82 88 76 90 72 88
              C68 90 64 90 60 88
              L60 18 Z
            "
            fill="url(#gradRight)"
          />
        </g>

        <!-- ── Center dividing line ── -->
        <line x1="60" y1="16" x2="60" y2="88" stroke="#1a1a2e" stroke-width="1.5" stroke-opacity="0.5"/>

        <!-- ── Heartbeat / wave line across the brain ── -->
        <polyline
          points="22,52 32,52 37,38 42,66 47,44 52,52 58,52 60,52 62,52 68,52 73,38 78,66 83,44 88,52 98,52"
          fill="none"
          stroke="#1a1a2e"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-opacity="0.7"
        />

        <!-- ── Left connector pin ── -->
        <line x1="44" y1="87" x2="44" y2="96" stroke="#1a1a2e" stroke-width="1.8" stroke-opacity="0.6"/>
        <circle cx="44" cy="98" r="2.5" fill="#1a1a2e" fill-opacity="0.5"/>

        <!-- ── Right connector pin ── -->
        <line x1="76" y1="87" x2="76" y2="96" stroke="#1a1a2e" stroke-width="1.8" stroke-opacity="0.6"/>
        <circle cx="76" cy="98" r="2.5" fill="#1a1a2e" fill-opacity="0.5"/>

        <!-- ── Horizontal base line ── -->
        <line x1="30" y1="100" x2="90" y2="100" stroke="#1a1a2e" stroke-width="1.5" stroke-opacity="0.4"/>
      </svg>
    </div>
  `,
  styles: [`
    .logo-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    svg { display: block; }
  `]
})
export class LogoComponent {
  /** Size in px — controls both width and height uniformly */
  @Input() size: number = 48;
}
