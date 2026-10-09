/** JWT payload'ını doğrulamadan okur (yalnızca UI için: rol/e-posta gösterimi). Yetki kararı sunucudadır. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

export function rolesFromJwt(token: string): string[] {
  const json = decodeJwtPayload(token);
  const claim = json['role'] ?? json['roles'] ?? [];
  return (Array.isArray(claim) ? claim : [claim]).filter((r): r is string => typeof r === 'string');
}

export function emailFromJwt(token: string): string | null {
  const email = decodeJwtPayload(token)['email'];
  return typeof email === 'string' && email ? email : null;
}
