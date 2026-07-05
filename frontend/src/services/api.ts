import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiRequestOptions extends RequestInit {
  body?: any;
}

class ApiClient {
  private isRefreshing = false;
  private refreshQueue: (() => void)[] = [];

  private getHeaders(options?: ApiRequestOptions): Headers {
    const headers = new Headers(options?.headers);
    const token = useAuthStore.getState().accessToken;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Default to application/json if sending a body and not sending FormData
    if (options?.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  async request<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers = this.getHeaders(options);
    
    let processedBody = options?.body;
    if (options?.body && !(options.body instanceof FormData)) {
      processedBody = JSON.stringify(options.body);
    }

    const config: RequestInit = {
      ...options,
      headers,
      body: processedBody,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
        // Attempt token refresh
        return new Promise<T>((resolve, reject) => {
          this.handleTokenRefresh()
            .then(() => {
              // Retry request with new token
              const retryHeaders = this.getHeaders(options);
              resolve(fetch(url, { ...config, headers: retryHeaders }).then((r) => this.handleResponse<T>(r)));
            })
            .catch((err) => {
              useAuthStore.getState().clearAuth();
              reject(err);
            });
        });
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const message = data?.message || response.statusText || 'Request failed';
      throw new Error(message);
    }

    return data;
  }

  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.refreshQueue.push(() => {
          resolve(useAuthStore.getState().accessToken || '');
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        throw new Error('Refresh token expired or invalid');
      }

      const payload = await res.json();
      const { accessToken, refreshToken: newRefreshToken, user } = payload.data;

      // Update store
      useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);

      // Execute queued requests
      this.refreshQueue.forEach((callback) => callback());
      this.refreshQueue = [];

      return accessToken;
    } catch (error) {
      useAuthStore.getState().clearAuth();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Helper HTTP methods
  get<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: any, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T>(path: string, body?: any, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
