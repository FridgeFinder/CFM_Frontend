import { ApiFridge, FridgeReport } from 'types/domain';

// Use an empty base URL by default so fetches are relative to the origin.
// Next.js config will automatically proxy /v1 to the NEXT_PUBLIC_FF_API_URL or json-server.
const BASE_URL = '';

class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown network error'
    );
  }
}

export const apiClient = {
  getFridges: () => request<ApiFridge[]>('/v1/fridges/'),
  getReports: () => request<FridgeReport[]>('/v1/reports/'),
};
