export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider: "google" | "discord";
}

export interface GameTokenPayload {
  sub: string; // user id
  name: string;
  image?: string;
  iat: number;
  exp: number;
}
