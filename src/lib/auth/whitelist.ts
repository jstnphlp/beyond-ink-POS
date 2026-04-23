type WhitelistCapableClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: unknown;
          error: { code?: string; message: string } | null;
        }>;
      };
    };
  };
};

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export async function isEmailWhitelisted(
  client: WhitelistCapableClient,
  email?: string | null,
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  const { data, error } = await client
    .from("allowed_users")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Whitelist lookup failed: ${error.message}`);
  }

  return Boolean(data);
}
