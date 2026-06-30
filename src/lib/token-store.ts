const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _refreshPromise: Promise<boolean> | null = null;
let _onExpired: (() => void) | null = null;

function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  _onExpired?.();
}

export const tokenStore = {
  set(at: string, rt: string) {
    _accessToken = at;
    _refreshToken = rt;
  },

  getAccessToken: (): string | null => _accessToken,

  onExpired: (cb: () => void) => {
    _onExpired = cb;
  },

  clear: clearTokens,

  async refresh(): Promise<boolean> {
    // Dedupe: si ya hay un refresh en curso, devolver el mismo Promise
    if (_refreshPromise) return _refreshPromise;
    if (!_refreshToken) {
      clearTokens();
      return false;
    }

    const rt = _refreshToken;
    _refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearTokens();
          return false;
        }
        const { data } = (await res.json()) as {
          data: { accessToken: string; refreshToken: string };
        };
        _accessToken = data.accessToken;
        _refreshToken = data.refreshToken;
        return true;
      })
      .catch(() => {
        clearTokens();
        return false;
      })
      .finally(() => {
        _refreshPromise = null;
      });

    return _refreshPromise;
  },
};
