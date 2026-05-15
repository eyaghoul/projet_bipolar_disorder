import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of notif.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="notif.dismiss(toast.id)">
          <span class="toast-icon">{{ icon(toast.type) }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
      display: flex; flex-direction: column; gap: 0.75rem; max-width: 380px;
    }
    .toast {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem 1.25rem; border-radius: 12px;
      backdrop-filter: blur(20px);
      border: 1px solid;
      cursor: pointer;
      animation: slideIn 0.3s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .toast-success { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #22c55e; }
    .toast-error   { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
    .toast-info    { background: rgba(0,180,216,0.15); border-color: rgba(0,180,216,0.3); color: #00b4d8; }
    .toast-warning { background: rgba(234,179,8,0.15); border-color: rgba(234,179,8,0.3); color: #eab308; }
    .toast-icon  { font-size: 1.25rem; flex-shrink: 0; }
    .toast-msg   { flex: 1; font-size: 0.9rem; font-weight: 500; color: #f0f8ff; }
    .toast-close { background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.875rem; padding: 0 0.25rem; }
  `],
})
export class ToastComponent {
  notif = inject(NotificationService);
  icon(type: string) {
    return { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type] ?? 'ℹ️';
  }
}
