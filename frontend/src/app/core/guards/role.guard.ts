import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  const user = auth.currentUser();
  if (user && allowedRoles.includes(user.role)) return true;
  // Redirect to appropriate dashboard
  const role = user?.role;
  if (role === 'patient') router.navigate(['/patient/questionnaire']);
  else if (role === 'professional') router.navigate(['/professional/patients']);
  else if (role === 'admin') router.navigate(['/admin/users']);
  else router.navigate(['/auth/login']);
  return false;
};
