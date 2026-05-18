export function shouldConsumeStoredPostAuthIntent(args: {
  previousUserId: string | null;
  currentUserId: string | null;
  sawExplicitSignIn: boolean;
}): boolean {
  return !args.previousUserId && Boolean(args.currentUserId) && args.sawExplicitSignIn;
}
