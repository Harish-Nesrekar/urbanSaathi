require("dotenv").config();

const { google } = require("googleapis");
const http = require("http");
const crypto = require("crypto");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5002/oauth2callback";
const PORT = 5002;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const state = crypto.randomBytes(24).toString("hex");

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
  state,
});

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);

  if (requestUrl.pathname !== "/oauth2callback") {
    res.writeHead(404);
    return res.end("Not found");
  }

  if (requestUrl.searchParams.get("state") !== state) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Invalid OAuth state. Please run the script again.");
  }

  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Google authorization failed: ${oauthError}`);
    console.error("Google authorization failed:", oauthError);
    return server.close();
  }

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Authorization code is missing.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      console.log("\nNew refresh token generated successfully.");
      console.log("Copy this value into GOOGLE_REFRESH_TOKEN in server/.env:\n");
      console.log(tokens.refresh_token);
    } else {
      console.log(
        "\nNo refresh token was returned. Do not overwrite your existing GOOGLE_REFRESH_TOKEN."
      );
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <h2>UrbanSaathi Gmail authorization successful.</h2>
      <p>You can close this browser tab and return to your terminal.</p>
    `);
  } catch (error) {
    console.error(
      "Token exchange failed:",
      error.response?.data?.error || error.message
    );

    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Token exchange failed. Check the terminal for details.");
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`OAuth callback server listening on port ${PORT}`);
  console.log("\nOpen this authorization URL in your browser:\n");
  console.log(authUrl);
  console.log("\nAuthorize the intended Gmail account.");
});