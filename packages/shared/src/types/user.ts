export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface MagicLinkVerify {
  token: string;
}
