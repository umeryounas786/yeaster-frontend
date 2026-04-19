export type Role = "super_admin" | "user";

export type UserStatus = "active" | "inactive" | "suspended";

export interface PbxCredentials {
  host?: string;
  apiClientId?: string;
  apiClientSecret?: string;
  port?: number;
  useHttps?: boolean;
}

export interface SuperAdminProfile {
  _id: string;
  username: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  pbx?: PbxCredentials;
  status: UserStatus;
  createdBy: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Profile = SuperAdminProfile | UserProfile;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: Role;
  profile: Profile;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  details?: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  fullName?: string;
  password: string;
  pbx?: PbxCredentials;
  status?: UserStatus;
}

export interface UpdateUserPayload {
  email?: string;
  fullName?: string;
  password?: string;
  pbx?: PbxCredentials;
  status?: UserStatus;
}

export interface Voicemail {
  _id: string;
  userId: string;
  msgId: string;
  extensionNumber: string;
  extensionName: string;
  fileName: string;
  callerName: string;
  callerNumber: string;
  receivedAt: string;
  duration: number;
  size: number;
  isRead: boolean;
  savedByUser: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WallboardResponse {
  items: Voicemail[];
  fetchedAt: string;
  syncSummary: { fetched: number; markedDeleted: number };
}
