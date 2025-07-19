export function isUnauthorizedError(error: Error): boolean {
  return /^(401|403): .*(Unauthorized|Forbidden)/.test(error.message);
}