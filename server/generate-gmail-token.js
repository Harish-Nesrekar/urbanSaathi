require("dotenv").config({ override: true });
require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.");
  process.exit(1);
}

const redirectUri = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log("\n1. Open this URL in your browser:\n");
console.log(authUrl);
console.log(
  "\n2. Authorize verifyyourdetails123@gmail.com.\n" +
  "3. Copy the authorization code from the redirected URL.\n"
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Paste the authorization code: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\nRefresh token:\n");
    console.log(tokens.refresh_token || "No refresh token returned.");
  } catch (error) {
    console.error("Token exchange failed:", error.message);
  } finally {
    rl.close();
  }
});
