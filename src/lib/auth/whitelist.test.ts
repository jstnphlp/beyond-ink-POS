import { describe, expect, it } from "vitest";

import {
  buildUnauthorizedUrl,
  getDashboardAccessCopy,
  getLoginAccessCopy,
  getUnauthorizedCopy,
} from "./access-copy";
import { isEmailWhitelisted, normalizeEmail } from "./whitelist";

describe("normalizeEmail", () => {
  it("lowercases and trims the supplied email", () => {
    expect(normalizeEmail("  Owner@BeyondInk.com  ")).toBe("owner@beyondink.com");
  });

  it("returns an empty string when email is missing", () => {
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("isEmailWhitelisted", () => {
  it("queries the allowlist with the normalized email", async () => {
    const calls: Array<{ column: string; value: string }> = [];

    const lookup = async (email: string) => {
      calls.push({ column: "email", value: email });

      return {
        data: { email: "owner@beyondink.com" },
        error: null,
      };
    };

    await expect(isEmailWhitelisted(lookup, " Owner@BeyondInk.com ")).resolves.toBe(true);
    expect(calls).toEqual([{ column: "email", value: "owner@beyondink.com" }]);
  });

  it("returns false when the email is empty", async () => {
    const lookup = async () => ({
      data: null,
      error: null,
    });

    await expect(isEmailWhitelisted(lookup, "")).resolves.toBe(false);
  });
});

describe("access copy", () => {
  it("keeps the dashboard message non-technical", () => {
    const copy = getDashboardAccessCopy();

    expect(copy).not.toContain("allowed_users");
    expect(copy).not.toContain("Supabase");
    expect(copy).not.toContain("@");
  });

  it("keeps the login message non-technical", () => {
    const copy = getLoginAccessCopy();

    expect(copy).not.toContain("allowed_users");
    expect(copy).not.toContain("Supabase");
    expect(copy).not.toContain("@");
  });

  it("keeps the unauthorized message generic", () => {
    const copy = getUnauthorizedCopy();

    expect(copy.title).toBe("Access not yet approved");
    expect(copy.body).not.toContain("allowed_users");
    expect(copy.body).not.toContain("@");
    expect(copy.help).not.toContain("Supabase");
  });

  it("does not append the signed-in email to the unauthorized URL", () => {
    expect(buildUnauthorizedUrl("https://example.com").toString()).toBe(
      "https://example.com/unauthorized",
    );
  });
});
