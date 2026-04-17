/**
 * Universal wrapper for API calls that auto-redirects to login on 401
 */
export const API_BASE_URL = '/api/proxy';

export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  // Automatically prepend API_BASE_URL if it's a relative path starting with /
  // Skip if it already contains API_BASE_URL (for smooth transition)
  const isRelative = input.startsWith('/');
  const hasBaseUrl = input.startsWith(API_BASE_URL);

  const url = isRelative && !hasBaseUrl ? `${API_BASE_URL}${input}` : input;

  const res = await fetch(url, init);

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const localeMatch = pathname.match(/^\/(vi|en)/);
      const locale = localeMatch ? localeMatch[1] : '';
      window.location.href = locale ? `/${locale}/login` : '/login';
    }
  }

  return res;
}
