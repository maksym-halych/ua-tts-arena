/** Accepts only a path on this site, so a crafted link can't send a rater to another site after sign-in. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
