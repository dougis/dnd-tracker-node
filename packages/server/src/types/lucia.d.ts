// Lucia Auth type definitions
declare module 'lucia' {
  interface Register {
    Lucia: import('../services/auth.js').AuthService['lucia'];
    DatabaseUserAttributes: {
      email: string;
      username: string;
      isEmailVerified: boolean;
      isAdmin: boolean;
    };
  }
}