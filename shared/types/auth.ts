export type AppUserRole = "user" | "admin";

export type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: AppUserRole;
  lastSignedIn: Date | null;
  loginMethod?: string | null;
};
