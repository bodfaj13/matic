/**
 * Swagger UI is only mounted when `APP_ENV` or `NODE_ENV` (default `local`) is
 * one of: local, development, dev — see STARTUP_LOGGING.md.
 */
export function shouldExposeSwaggerDocs(): boolean {
  const env = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'local';
  return ['local', 'development', 'dev'].includes(env);
}
