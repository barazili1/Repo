
export enum KeyType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary'
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: KeyType;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt?: string; // Only for temporary keys
  usageCount: number;
  lastUsed?: string;
}

export interface KeyStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  permanent: number;
  temporary: number;
}
