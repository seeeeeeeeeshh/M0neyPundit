// Fetch with timeout to prevent indefinite hanging
const DEFAULT_TIMEOUT = 5000; // 5 seconds

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    // If aborted, return a mock error response
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timed out' }),
        {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    throw err;
  }
}