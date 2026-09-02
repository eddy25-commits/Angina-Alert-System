export function humanizeAlertError(message: string): string {
  const known = [
    "No trusted contact connected",
    "Alert not found or already resolved",
    "Alert not found or already acknowledged",
  ];
  const match = known.find((m) => message.includes(m));
  return match ?? "Something went wrong sending the alert. Please try again.";
}

export function humanizePairingError(message: string): string {
  // Postgres wraps our RAISE EXCEPTION text; pass known ones through
  // as-is since we wrote them to already be user-facing.
  const known = [
    "That code is not valid",
    "That code has already been used",
    "That code has expired",
    "You can't redeem your own pairing code",
    "Already paired with a trusted contact",
    "That person is already paired with someone",
  ];
  const match = known.find((m) => message.includes(m));
  return match ?? "Couldn't pair with that code. Please try again.";
}
