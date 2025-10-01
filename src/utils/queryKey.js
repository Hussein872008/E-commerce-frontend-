function serializeFilters(obj) {
  if (!obj || typeof obj !== 'object') return String(obj);
  const entries = Object.keys(obj)
    .filter(k => typeof obj[k] !== 'undefined' && obj[k] !== null && String(obj[k]).length > 0)
    .sort()
    .map(k => `${k}=${String(obj[k])}`);
  return entries.join('&');
}

export default serializeFilters;
