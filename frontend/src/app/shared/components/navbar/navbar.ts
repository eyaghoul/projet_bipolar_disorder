import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <!-- Logo -->
        <a class="nav-brand" routerLink="/">
          <span class="brand-icon">🧠</span>
          <span class="brand-text">BipolarGuide</span>
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
      background: #1A1A1A;
      border-bottom: 1px solid #404040;
      height: 64px;
    }
    .nav-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 0 24px; height: 100%;
      display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none;
    }
    .brand-icon { font-size: 24px; }
    .brand-text { font-size: 20px; font-weight: 800; color: #1976D2; }
    
    .nav-links { display: flex; gap: 8px; }
    .nav-links a {
      padding: 8px 12px; border-radius: 8px;
      color: #B0B0B0; text-decoration: none;
      font-size: 15px; font-weight: 500;
      transition: all 0.2s;
    }
    .nav-links a:hover { color: #FFFFFF; background: #2D2D2D; }
    .nav-links a.active { color: #FFFFFF; background: #1976D2; }
    
    .nav-right { display: flex; align-items: center; gap: 16px; }
    .plan-badge {
      padding: 4px 12px; border-radius: 100px;
      font-size: 12px; font-weight: 700;
      background: #2D2D2D; color: #B0B0B0;
      border: 1px solid #404040;
    }
    .plan-badge.premium { border-color: #1976D2; color: #1976D2; }
    
    .btn-upgrade {
      padding: 8px 16px; border-radius: 8px;
      background: #1976D2; color: #fff;
      text-decoration: none; font-size: 14px; font-weight: 600;
    }
    
    .avatar-wrap { position: relative; cursor: pointer; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #1976D2; display: flex; align-items: center;
      justify-content: center; font-weight: 700; color: #fff;
    }
    
    .dropdown {
      position: absolute; top: 48px; right: 0;
      background: #2D2D2D; border: 1px solid #404040;
      border-radius: 12px; padding: 8px; min-width: 180px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .dropdown-header { padding: 8px 12px; }
    .d-name { font-weight: 600; font-size: 14px; }
    .d-email { color: #B0B0B0; font-size: 12px; }
    .dropdown hr { border: 0; border-top: 1px solid #404040; margin: 8px 0; }
    .dropdown button {
      width: 100%; padding: 8px 12px; border-radius: 8px;
      background: none; border: none; color: #D32F2F;
      text-align: left; cursor: pointer; font-size: 14px;
    }
    .dropdown button:hover { background: rgba(211, 47, 47, 0.1); }
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
