import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="buttonSecondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
