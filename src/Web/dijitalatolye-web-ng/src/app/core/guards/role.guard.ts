import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export function roleGuard(required: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthStore);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
    return auth.hasAnyRole(required) ? true : router.createUrlTree(['/']);
  };
}
