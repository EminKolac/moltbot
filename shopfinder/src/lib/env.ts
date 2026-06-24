/** Load shopfinder/.env into process.env (no-op if absent). Node >= 20.12. */
export function loadEnv(): void {
  try {
    (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.();
  } catch {
    // .env not present or unreadable — rely on real environment variables.
  }
}
