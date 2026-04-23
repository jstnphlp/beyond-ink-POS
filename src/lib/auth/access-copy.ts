export function getDashboardAccessCopy() {
  return "Only approved staff accounts can open and use this system.";
}

export function getLoginAccessCopy() {
  return "Sign in with your approved Google account to continue.";
}

export function getUnauthorizedCopy() {
  return {
    title: "Access not yet approved",
    body: "This Google account can sign in, but it is not currently approved to use the system.",
    help: "Ask the system administrator to approve this account, then try again.",
  };
}

export function buildUnauthorizedUrl(origin: string) {
  return new URL("/unauthorized", origin);
}
