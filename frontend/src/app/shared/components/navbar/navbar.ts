import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, LogoComponent],
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <!-- Logo -->
        <a class="nav-brand" routerLink="/">
          <app-logo [size]="38"></app-logo>
          <span class="brand-text">BIPOLAR GUIDE</span>
        </a>

        <!-- Nav links -->
        <div class="nav-links" *ngIf="auth.isLoggedIn()">
          <!-- Patient links -->
          <ng-container *ngIf="auth.currentUser()?.role === 'patient'">
            <a routerLink="/patient/questionnaire" routerLinkActive="active">Assessment</a>
            <a routerLink="/patient/results"       routerLinkActive="active">Results</a>
            <a routerLink="/patient/mood-tracker"  routerLinkActive="active">Mood</a>
            <a routerLink="/patient/nearby-psychologists" routerLinkActive="active" *ngIf="isPremium()">
              Find Providers
            </a>
            <a routerLink="/patient/report" routerLinkActive="active" *ngIf="isPremium()">
              Report
            </a>
          </ng-container>

          <!-- Professional links -->
          <ng-container *ngIf="auth.currentUser()?.role === 'professional'">
            <a routerLink="/professional/patients" routerLinkActive="active">Patients</a>
            <a routerLink="/professional/connection-requests" routerLinkActive="active">Requests</a>
            <a routerLink="/professional/profile" routerLinkActive="active">Office</a>
          </ng-container>

          <!-- Admin links -->
          <ng-container *ngIf="auth.currentUser()?.role === 'admin'">
            <a routerLink="/admin/users"            routerLinkActive="active">Users</a>
            <a routerLink="/admin/model-monitoring" routerLinkActive="active">Model</a>
            <a routerLink="/admin/audit-logs"       routerLinkActive="active">Audit</a>
            <a routerLink="/admin/settings"         routerLinkActive="active">Settings</a>
          </ng-container>
        </div>

        <!-- Right side -->
        <div class="nav-right" *ngIf="auth.isLoggedIn()">
          <!-- Plan badge -->
          <span class="plan-badge" [class.premium]="isPremium()">
            {{ isPremium() ? '⭐ Premium' : 'Free' }}
          </span>

          <!-- Upgrade CTA -->
          <a *ngIf="!isPremium() && auth.currentUser()?.role === 'patient'"
             routerLink="/auth/upgrade" class="btn-upgrade">
            Upgrade
          </a>

          <!-- Avatar dropdown -->
          <div class="avatar-wrap" (click)="toggleMenu()" [class.open]="menuOpen">
            <div class="avatar">{{ initials() }}</div>
            <div class="dropdown" *ngIf="menuOpen">
              <div class="dropdown-header">
                <div class="d-name">{{ auth.currentUser()?.name }}</div>
                <div class="d-email">{{ auth.currentUser()?.email }}</div>
              </div>
              <hr>
              <button (click)="auth.logout()">Sign out</button>
            </div>
          </div>
        </div>

        <!-- Login/Register -->
        <div class="nav-right" *ngIf="!auth.isLoggedIn()">
          <a routerLink="/auth/login"    class="btn-nav-ghost">Login</a>
          <a routerLink="/auth/register" class="btn-nav-solid">Get Started</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
      height: 64px;
      box-shadow: 0 1px 8px rgba(96, 89, 247, 0.08);
    }
    .nav-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 0 24px; height: 100%;
      display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .brand-text {
      font-size: 16px; font-weight: 800; letter-spacing: 0.06em;
      background: linear-gradient(135deg, #6059f7, #8c61ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .nav-links { display: flex; gap: 8px; }
    .nav-links a {
      padding: 8px 12px; border-radius: 8px;
      color: var(--text-secondary); text-decoration: none;
      font-size: 15px; font-weight: 500;
      transition: all 0.2s;
    }
    .nav-links a:hover { color: var(--primary); background: rgba(96, 89, 247, 0.06); }
    .nav-links a.active { color: #fff; background: var(--primary); }
    
    .nav-right { display: flex; align-items: center; gap: 16px; }
    .plan-badge {
      padding: 4px 12px; border-radius: 100px;
      font-size: 12px; font-weight: 700;
      background: var(--bg-dark); color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .plan-badge.premium { border-color: var(--primary); color: var(--primary); background: rgba(96, 89, 247, 0.06); }
    
    .btn-upgrade {
      padding: 8px 16px; border-radius: 8px;
      background: var(--primary); color: #fff;
      text-decoration: none; font-size: 14px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-upgrade:hover { background: var(--primary-hover); }
    
    .avatar-wrap { position: relative; cursor: pointer; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--primary); display: flex; align-items: center;
      justify-content: center; font-weight: 700; color: #fff;
    }
    
    .dropdown {
      position: absolute; top: 48px; right: 0;
      background: var(--card-bg); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 8px; min-width: 180px;
      box-shadow: 0 8px 24px rgba(96, 89, 247, 0.12);
    }
    .dropdown-header { padding: 8px 12px; }
    .d-name  { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .d-email { color: var(--text-muted); font-size: 12px; }
    .dropdown hr { border: 0; border-top: 1px solid var(--border-color); margin: 8px 0; }
    .dropdown button {
      width: 100%; padding: 8px 12px; border-radius: 8px;
      background: none; border: none; color: #C62828;
      text-align: left; cursor: pointer; font-size: 14px;
    }
    .dropdown button:hover { background: rgba(211, 47, 47, 0.08); }
  `],
})
export class NavbarComponent {
  auth = inject(AuthService);
  menuOpen = false;
  isPremium() { return this.auth.currentUser()?.plan === 'premium'; }
  initials() {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }
  toggleMenu() { this.menuOpen = !this.menuOpen; }
}
