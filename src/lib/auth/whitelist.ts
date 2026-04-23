export type WhitelistLookup = (
  email: string,
) => PromiseLike<{
  data: unknown;
  error: { code?: string; message: string } | null;
}>;

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export async function isEmailWhitelisted(lookup: WhitelistLookup, email?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  const { data, error } = await lookup(normalizedEmail);

  if (error && error.code !== "PGRST116") {
    throw new Error(`Whitelist lookup failed: ${error.message}`);
  }

  return Boolean(data);
}
