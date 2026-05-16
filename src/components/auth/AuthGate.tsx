import { cloneElement, isValidElement, useCallback, type ReactElement } from "react";
import { useAuth } from "@/lib/auth-context";
import type { PostAuthIntent } from "@/lib/post-auth-intent";

type Props = {
  /** Called only after the user is authenticated (or immediately if already signed in). */
  pendingAction: () => void | Promise<void>;
  /** Persisted for OAuth / magic-link return */
  resumeIntent?: PostAuthIntent;
  children: ReactElement<{ onClick?: (e: React.MouseEvent) => void; disabled?: boolean }>;
};

/**
 * Wraps a clickable element: unauthenticated users see the login sheet instead of the default action.
 */
export function AuthGate({ pendingAction, resumeIntent, children }: Props) {
  const { requestAuth, ready } = useAuth();

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      if (e.defaultPrevented) return;
      if (!ready) return;
      e.preventDefault();
      e.stopPropagation();
      requestAuth(pendingAction, resumeIntent);
    },
    [children.props, pendingAction, resumeIntent, requestAuth, ready],
  );

  if (!isValidElement(children)) {
    throw new Error("AuthGate expects a single React element child");
  }

  return cloneElement(children, {
    ...children.props,
    disabled: Boolean(children.props.disabled),
    "aria-busy": !ready ? true : undefined,
    onClick,
  });
}
