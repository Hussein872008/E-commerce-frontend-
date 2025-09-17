export function resolveRoleFromUser(userOrRole) {
  if (!userOrRole) return null;
  if (typeof userOrRole === 'string') return userOrRole;
  const user = userOrRole;
  return user.role || user.activeRole || (Array.isArray(user.roles) && user.roles.length ? user.roles[0] : null);
}

export function isBuyer(userOrRole) {
  const r = resolveRoleFromUser(userOrRole);
  return r === 'buyer';
}

export function isSeller(userOrRole) {
  const r = resolveRoleFromUser(userOrRole);
  return r === 'seller';
}

export default { resolveRoleFromUser, isBuyer, isSeller };
