// Verifies a Cloudflare Turnstile token server-side. The widget itself only
// stops unscripted bots, the client-side token is meaningless on its own,
// this siteverify call is what actually confirms the token is real, unused,
// and was issued for this site. Netlify Functions on Node 22 have global
// fetch, so no extra HTTP client dependency is needed.
async function verifyTurnstile(token, remoteIp) {
  if (!token) {
    return false;
  }

  const params = new URLSearchParams();
  params.append("secret", process.env.TURNSTILE_SECRET_KEY);
  params.append("response", token);
  if (remoteIp) {
    params.append("remoteip", remoteIp);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: params }
    );
    const outcome = await response.json();
    return outcome.success === true;
  } catch (error) {
    console.error("Error verifying Turnstile token:", error);
    return false;
  }
}

module.exports = { verifyTurnstile };