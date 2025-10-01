export function normalizeUser(user) {
  if (!user) return null;
  const u = { ...user };
  if (!u._id && u.id) u._id = u.id;
  if (!u.id && u._id) u.id = u._id;
  return u;
}

export function resolveUserId(userOrId) {
  if (!userOrId) return null;
  if (typeof userOrId === 'string') return userOrId;
  const user = userOrId;
  return user._id || user.id || null;
}

export default { normalizeUser, resolveUserId };
