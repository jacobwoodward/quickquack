/**
 * HTML escape utility to prevent XSS in email templates
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/**
 * Escape HTML special characters to prevent XSS attacks
 * Use this for any user-provided content that will be rendered in HTML emails
 */
export function escapeHtml(text: string | null | undefined): string {
  if (text == null) return "";
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}
