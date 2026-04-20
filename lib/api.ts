import type {
  ApiEnvelope,
  AuthResponse,
  CreateUserPayload,
  PaginatedResult,
  Profile,
  Role,
  SyncResponse,
  UpdateUserPayload,
  UserProfile,
  UserStats,
  Voicemail,
  WallboardResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

const ACCESS_KEY = "yw_access_token";
const REFRESH_KEY = "yw_refresh_token";
const ROLE_KEY = "yw_role";

export const tokenStore = {
  getAccess: () =>
    typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY),
  getRefresh: () =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  getRole: () =>
    typeof window === "undefined"
      ? null
      : (localStorage.getItem(ROLE_KEY) as Role | null),
  set: (access: string, refresh: string, role: Role) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(ROLE_KEY, role);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
}

async function request<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;

  let url = `${API_BASE}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "omit",
    });
  } catch {
    throw new ApiError(0, "Network error — is the API running?");
  }

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON response (rare)
  }

  if (!res.ok) {
    const msg = json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, json?.details);
  }

  return (json?.data as T) ?? (undefined as unknown as T);
}

export const authApi = {
  login: (username: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    }),

  me: () =>
    request<{ role: Role; profile: Profile }>("/auth/me", { method: "GET" }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    }),

  logout: () => request<null>("/auth/logout", { method: "POST" }),
};

export const usersApi = {
  stats: () => request<UserStats>("/users/stats"),

  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) =>
    request<PaginatedResult<UserProfile>>("/users", {
      query: params,
    }),

  get: (id: string) => request<UserProfile>(`/users/${id}`),

  create: (payload: CreateUserPayload) =>
    request<UserProfile>("/users", { method: "POST", body: payload }),

  update: (id: string, payload: UpdateUserPayload) =>
    request<UserProfile>(`/users/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) =>
    request<null>(`/users/${id}`, { method: "DELETE" }),
};

export const voicemailApi = {
  // Read-only: hits our DB, never the PBX. Safe to call for pagination / filter.
  wallboard: (
    params: {
      extensionNumber?: string;
      search?: string;
      filter?: string;
      page?: number;
      limit?: number;
    } = {}
  ) =>
    request<WallboardResponse>("/voicemails/wallboard", {
      query: {
        extensionNumber: params.extensionNumber,
        search: params.search,
        filter: params.filter,
        page: params.page,
        limit: params.limit,
      },
    }),

  // Triggers a background PBX sync. Returns immediately.
  sync: () =>
    request<SyncResponse>("/voicemails/sync", { method: "POST" }),

  testConnection: () =>
    request<{ ok: boolean }>("/voicemails/test-connection", {
      method: "POST",
    }),

  markSaved: (id: string) =>
    request<Voicemail>(`/voicemails/${id}/save`, { method: "POST" }),

  unmarkSaved: (id: string) =>
    request<Voicemail>(`/voicemails/${id}/save`, { method: "DELETE" }),
};
