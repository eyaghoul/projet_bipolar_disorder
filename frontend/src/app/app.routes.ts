import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { premiumGuard } from './core/guards/premium.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // ── Auth ─────────────────────────────────────────────────────
  {
    path: 'auth',
    children: [
      { path: 'login',    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent) },
      { path: 'upgrade',  loadComponent: () => import('./auth/upgrade/upgrade').then(m => m.UpgradeComponent), canActivate: [authGuard] },
    ],
  },

  // ── Patient ──────────────────────────────────────────────────
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['patient'] },
    children: [
      { path: 'questionnaire', loadComponent: () => import('./patient/questionnaire/questionnaire').then(m => m.QuestionnaireComponent) },
      { path: 'results',       loadComponent: () => import('./patient/results/results').then(m => m.ResultsComponent) },
      { path: 'mood-tracker',  loadComponent: () => import('./patient/mood-tracker/mood-tracker').then(m => m.MoodTrackerComponent) },
      {
        path: 'nearby-psychologists',
        loadComponent: () => import('./patient/nearby-psychologists/nearby-psychologists').then(m => m.NearbyPsychologistsComponent),
        canActivate: [premiumGuard],
      },
      {
        path: 'report',
        loadComponent: () => import('./patient/report/report').then(m => m.ReportComponent),
        canActivate: [premiumGuard],
      },
    ],
  },

  // ── Professional ─────────────────────────────────────────────
  {
    path: 'professional',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['professional'] },
    children: [
      { path: 'patients',        loadComponent: () => import('./professional/patients/patients').then(m => m.PatientsComponent) },
      { path: 'patient/:id',     loadComponent: () => import('./professional/patient-detail/patient-detail').then(m => m.PatientDetailComponent) },
      { path: 'connection-requests', loadComponent: () => import('./professional/connection-requests/connection-requests').then(m => m.ConnectionRequestsComponent) },
      { path: 'profile', loadComponent: () => import('./professional/profile/profile').then(m => m.ProfessionalProfileComponent) },
    ],
  },

  // ── Admin ────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: 'users',            loadComponent: () => import('./admin/users/users').then(m => m.UsersComponent) },
      { path: 'model-monitoring', loadComponent: () => import('./admin/model-monitoring/model-monitoring').then(m => m.ModelMonitoringComponent) },
      { path: 'audit-logs',       loadComponent: () => import('./admin/audit-logs/audit-logs').then(m => m.AuditLogsComponent) },
      { path: 'settings',         loadComponent: () => import('./admin/settings/settings').then(m => m.SettingsComponent) },
    ],
  },

  { path: '**', redirectTo: '/auth/login' },
];
