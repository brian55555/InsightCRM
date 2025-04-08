/**
 * OAuth 2.0 Authorization Code Flow Utilities
 */

/**
 * Generate an authorization URL for OAuth 2.0
 * @param {string} clientId - Your OAuth client ID
 * @param {string} redirectUri - The URI to redirect to after authorization
 * @param {string} scope - Space-separated list of scopes to request
 * @param {string} state - Random string to prevent CSRF attacks
 * @returns {string} The authorization URL
 */
export function generateAuthUrl(clientId, redirectUri, scope, state) {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("access_type", "offline"); // For refresh token
  authUrl.searchParams.append("prompt", "consent"); // Force to show consent screen
  authUrl.searchParams.append("state", state);

  return authUrl.toString();
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - The authorization code from the callback
 * @param {string} clientId - Your OAuth client ID
 * @param {string} clientSecret - Your OAuth client secret
 * @param {string} redirectUri - The same redirect URI used in the auth request
 * @returns {Promise<Object>} The token response
 */
export async function exchangeCodeForTokens(
  code,
  clientId,
  clientSecret,
  redirectUri,
) {
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const params = new URLSearchParams();
  params.append("code", code);
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("redirect_uri", redirectUri);
  params.append("grant_type", "authorization_code");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Token exchange failed: ${errorData.error_description || errorData.error || "Unknown error"}`,
    );
  }

  return response.json();
}

/**
 * Generate a random state parameter to prevent CSRF attacks
 * @returns {string} A random string
 */
export function generateState() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
