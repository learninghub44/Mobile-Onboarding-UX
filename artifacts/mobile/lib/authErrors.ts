/**
 * Maps Supabase Auth errors to clear, actionable messages for the UI.
 * Supabase's raw error text is written for logs, not end users (e.g.
 * "AuthApiError: Email rate limit exceeded"), so every auth call site
 * should route its catch block through this instead of showing
 * error.message directly or a generic string that hides the cause.
 */

type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

function isAuthErrorLike(err: unknown): err is AuthErrorLike {
  return typeof err === 'object' && err !== null && ('message' in err || 'status' in err || 'code' in err);
}

export function getAuthErrorMessage(err: unknown): string {
  if (!isAuthErrorLike(err)) {
    return 'Something went wrong. Please check your connection and try again.';
  }

  const message = (err.message ?? '').toLowerCase();
  const code = (err.code ?? '').toLowerCase();

  // Rate limiting -- Supabase caps how many auth emails (password reset,
  // confirmation, magic link) can be sent per address/project in a window.
  if (
    code.includes('rate_limit') ||
    message.includes('rate limit') ||
    err.status === 429
  ) {
    if (message.includes('email') || code.includes('email')) {
      return "You've requested this too many times recently. Please wait a few minutes before trying again, or check your inbox (and spam folder) for the earlier email.";
    }
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again or reset your password.';
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Please confirm your email address first -- check your inbox for a confirmation link.';
  }

  if (code === 'user_already_exists' || message.includes('already registered') || message.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (code === 'weak_password' || message.includes('password should be')) {
    return 'Please choose a stronger password (at least 8 characters, with a mix of letters, numbers, and symbols).';
  }

  if (code === 'over_request_rate_limit') {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (message.includes('failed to fetch') || message.includes('network request failed')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }

  // Fall back to Supabase's own message when we don't have a friendlier
  // mapping for it -- still better than a generic string that hides
  // genuinely useful detail (e.g. link expiry, validation messages).
  return err.message || 'Something went wrong. Please try again.';
}
