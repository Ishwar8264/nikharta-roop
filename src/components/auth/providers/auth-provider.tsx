"use client";

// Load the shared API error so stale sessions can be handled without hiding network failures.
import { ApiClientError } from "@/src/lib/api-client";
// Load the authenticated endpoints that restore and revoke browser sessions.
import {
  getCurrentUser,
  logoutCurrentUser,
} from "@/src/services/auth/auth.client";
// Load the user contract shared by OTP completion and the me endpoint.
import type { AuthenticatedUser } from "@/src/types/auth";
// Load client navigation so successful logout returns to the public login route.
import { useRouter } from "next/navigation";
// Load focused React APIs for one application-wide session context.
import {
  createContext,
  useCallback,
  use,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
// Load the React node type accepted by the root provider boundary.
import type { ReactNode } from "react";

// Describe the minimal session behavior needed by authentication and private UI.
type AuthContextValue = {
  // Synchronize the safe user returned after successful OTP verification.
  completeAuthentication: (user: AuthenticatedUser) => void;
  // Expose a derived flag for future private route composition.
  isAuthenticated: boolean;
  // Keep user controls neutral until session restoration resolves.
  isLoading: boolean;
  // Revoke the current server session before clearing client state.
  logout: () => Promise<void>;
  // Expose only safe user data and never raw authentication tokens.
  user: AuthenticatedUser | null;
};

// Keep an undefined default so consumers outside the provider fail clearly.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Configure the root client boundary that owns browser authentication state.
type AuthProviderProps = {
  // Render the existing Server and Client Component tree inside the session boundary.
  children: ReactNode;
};

// Keep user data and restoration progress synchronized through one state transition.
type AuthState = {
  // Track whether the initial browser session is still resolving.
  isLoading: boolean;
  // Store safe authenticated user data or null for an anonymous session.
  user: AuthenticatedUser | null;
};

// Describe every deliberate session transition handled by the root provider.
type AuthAction =
  // Apply a user returned by successful OTP verification.
  | { type: "AUTHENTICATED"; user: AuthenticatedUser }
  // Clear the resolved session after logout.
  | { type: "LOGGED_OUT" }
  // Complete initial restoration with a user or anonymous state.
  | { type: "RESTORED"; user: AuthenticatedUser | null };

// Start without safe user data while the provider checks protected cookies.
const INITIAL_AUTH_STATE: AuthState = {
  // Hide resolved account controls until the first me request finishes.
  isLoading: true,
  // Start without assuming that protected browser cookies are valid.
  user: null,
};

// Apply one atomic state update for restore, login, or logout transitions.
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  // Synchronize a newly verified OTP user and finish initial restoration together.
  if (action.type === "AUTHENTICATED") {
    return { isLoading: false, user: action.user };
  }

  // Clear resolved user data after logout or an already-invalid server session.
  if (action.type === "LOGGED_OUT") {
    return { isLoading: false, user: null };
  }

  // Finish initial restoration with either the current user or an anonymous session.
  if (action.type === "RESTORED") {
    return { isLoading: false, user: action.user };
  }

  // Preserve current state if a future unsupported action reaches this reducer.
  return state;
};

// Restore HttpOnly-cookie sessions and expose focused auth actions to client UI.
export function AuthProvider({ children }: AuthProviderProps) {
  // Keep safe user data and restoration progress inside one atomic reducer state.
  const [{ isLoading, user }, dispatch] = useReducer(
    authReducer,
    INITIAL_AUTH_STATE,
  );

  // Read only the App Router methods needed after the server confirms logout.
  const { refresh, replace } = useRouter();

  // Track newer auth actions so a slow initial me request cannot overwrite them.
  const sessionRevision = useRef(0);

  // Accept the verified user returned with a newly established OTP session.
  const completeAuthentication = useCallback(
    (authenticatedUser: AuthenticatedUser) => {
      // Invalidate any older restoration request still waiting on the network.
      sessionRevision.current += 1;

      // Reuse the verified response and finish restoration through one state transition.
      dispatch({ type: "AUTHENTICATED", user: authenticatedUser });
    },
    [],
  );

  // Revoke the server session before clearing local user state and leaving private UI.
  const logout = useCallback(async () => {
    try {
      // Revoke the live session and clear both protected authentication cookies.
      await logoutCurrentUser();
    } catch (error) {
      // Treat an already-invalid server session as logged out for the browser UI.
      if (!(error instanceof ApiClientError && error.statusCode === 401)) {
        throw error;
      }
    }

    // Invalidate any older restoration result before clearing authenticated UI.
    sessionRevision.current += 1;

    // Remove safe user data only after logout succeeds or the session is already invalid.
    dispatch({ type: "LOGGED_OUT" });

    // Replace private history so the back button does not imply an active session.
    replace("/login");

    // Refresh Server Component output after the authentication state changes.
    refresh();
  }, [refresh, replace]);

  // Restore an existing browser session once when the root provider hydrates.
  useEffect(() => {
    // Prevent a completed request from updating a provider that already unmounted.
    let isActive = true;

    // Capture the auth revision that this initial restoration is allowed to update.
    const restoreRevision = sessionRevision.current;

    // Keep asynchronous restoration scoped inside the effect lifecycle.
    const restoreSession = async () => {
      try {
        // Load the current user and rotate an expired access cookie when available.
        const currentUser = await getCurrentUser();

        // Apply the restored profile only while this provider remains mounted.
        if (isActive && sessionRevision.current === restoreRevision) {
          dispatch({ type: "RESTORED", user: currentUser });
        }
      } catch {
        // Keep unauthenticated and expired sessions represented by a null user.
        if (isActive && sessionRevision.current === restoreRevision) {
          dispatch({ type: "RESTORED", user: null });
        }
      }
    };

    // Start restoration without returning its promise from the React effect.
    void restoreSession();

    // Ignore late request completion after the root provider is removed.
    return () => {
      isActive = false;
    };
  }, []);

  // Derive authentication directly from the canonical user state.
  const isAuthenticated = Boolean(user);

  // Stabilize the context object so consumers update only when auth data changes.
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      // Expose the stable OTP completion action.
      completeAuthentication,
      // Expose the user-derived authentication flag.
      isAuthenticated,
      // Expose initial restoration progress.
      isLoading,
      // Expose the stable server-backed logout action.
      logout,
      // Expose the current safe authenticated user.
      user,
    }),
    [completeAuthentication, isAuthenticated, isLoading, logout, user],
  );

  // Share the resolved browser session with authentication and private components.
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Read the global session through one typed hook used by client components.
export function useAuth() {
  // Read the nearest root authentication provider value.
  const context = use(AuthContext);

  // Fail early when a component is rendered outside the required provider boundary.
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  // Return the focused session API without exposing internal state setters.
  return context;
}
