// The app's production web domain (Cloudflare CNAME -> Railway).
// Used for expo-router web origin metadata and for auth redirect URLs
// (password reset / OAuth) when the app is running in a browser rather
// than as a native app, since native uses the `chamayetu://` scheme.
export const WEB_APP_URL = 'https://chamayetu.christech.co.ke';
