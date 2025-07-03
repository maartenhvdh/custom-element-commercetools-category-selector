export type Config = Readonly<{
  authUrl: string;
  apiUrl: string; 
  projectKey: string;
  clientId: string;
  clientSecret: string;
}>;

export const isConfig = (value: Readonly<Record<string, unknown>> | null) =>
  value !== null && 
  typeof value.authUrl === 'string' &&
  typeof value.apiUrl === 'string' &&
  typeof value.projectKey === 'string' &&
  typeof value.clientId === 'string' &&
  typeof value.clientSecret === 'string'