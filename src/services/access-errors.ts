export function getAccessErrorMessage(
  error: unknown
) {
  const message =
    String(error);

  if (
    message.includes(
      "AUTH_REQUIRED"
    )
  ) {
    return "Please sign in to continue.";
  }

  if (
    message.includes(
      "VERIFIED_OFFICIAL_REQUIRED"
    )
  ) {
    return "This action requires a verified SK official account.";
  }

  if (
    message.includes(
      "ACCESS_DENIED"
    )
  ) {
    return "Your local account does not have permission to access this official record.";
  }

  return "You do not have permission to perform this action.";
}
