export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh' | 'email-verification';
  jti?: string; // JWT ID for token uniqueness
}
