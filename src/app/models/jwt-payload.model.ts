export interface JwtPayload {
  sub: string;
  role?: string;
  name?: string;
  iat: number;
  exp: number;
}