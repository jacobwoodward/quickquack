/**
 * Validates redirect URLs to prevent open redirect vulnerabilities
 * Only allows relative paths to known internal routes
 */
export function validateRedirectUrl(
  redirectTo: string | null,
  defaultPath: string = "/dashboard"
): string {
  if (!redirectTo) {
    return defaultPath;
  }

  // Only allow relative paths starting with /
  if (!redirectTo.startsWith("/")) {
    return defaultPath;
  }

  // Block protocol-relative URLs (//evil.com)
  if (redirectTo.startsWith("//")) {
    return defaultPath;
  }

  // Block backslash bypasses
  if (redirectTo.includes("\\")) {
    return defaultPath;
  }

  // Allowlist of valid path prefixes
  const allowedPrefixes = [
    "/dashboard",
    "/event-types",
    "/availability",
    "/settings",
    "/bookings",
    "/appearance",
    "/links",
    "/emails",
    "/payments",
  ];

  const isAllowed = allowedPrefixes.some((prefix) =>
    redirectTo.startsWith(prefix)
  );

  return isAllowed ? redirectTo : defaultPath;
}
