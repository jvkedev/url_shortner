export interface JwtPayload {
  sub: string;
  type: 'access' | 'email-verification';
}
