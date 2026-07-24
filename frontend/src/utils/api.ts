export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export async function safeParseJson(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  if (!response.ok) {
    // If HTML error page is returned (e.g. 404/500 from server or proxy)
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;
    throw new Error(title || `Server error (${response.status}): ${text.substring(0, 100)}`);
  }
  throw new Error(`Expected JSON response but received ${contentType || 'text'}`);
}
