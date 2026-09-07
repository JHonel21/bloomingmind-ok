const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const validator = require("validator");
const { getStore } = require("@netlify/blobs");
const { verifyTurnstile } = require("./lib/verify-turnstile");

function loadSessions() {
  const dataPath = path.join(__dirname, "data", "sessions.json");
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

// Strip newlines/carriage returns to prevent header injection via the
// "from"/subject line, matching the pattern used in send-email.js.
function stripNewlines(str) {
  return String(str).replace(/[\r\n]+/g, " ").trim();
}

// Reserves one seat for sessionId using an optimistic-concurrency loop.
// Two people submitting at the same instant will race to write the record;
// onlyIfMatch (or onlyIfNew for the very first booking) makes sure only one
// of them wins each round, and the loser simply re-reads and tries again.
async function reserveSeat(store, sessionId, capacity, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const existing = await store.getWithMetadata(sessionId, {
      type: "json",
      consistency: "strong",
    });

    const booked = existing?.data?.booked || 0;

    if (booked >= capacity) {
      return { success: false, reason: "full" };
    }

    const nextRecord = { booked: booked + 1 };
    const writeOptions = existing?.etag
      ? { onlyIfMatch: existing.etag }
      : { onlyIfNew: true };

    const result = await store.setJSON(sessionId, nextRecord, writeOptions);

    if (result.modified) {
      return { success: true, seatsRemaining: capacity - nextRecord.booked };
    }
    // Someone else wrote to this record between our read and write. Loop
    // around and retry with a fresh read rather than overwriting their seat.
  }

  return { success: false, reason: "conflict" };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: "Invalid request body." };
  }

  const { sessionId, name, email, phone, notes, botField, turnstileToken } = body;

  // Honeypot field: real visitors never see or fill this in. If it has a
  // value, silently pretend success so bots don't learn to look elsewhere.
  if (botField) {
    return { statusCode: 200, body: "OK" };
  }

  if (!sessionId || !name || !email) {
    return { statusCode: 400, body: "Name, email, and session are required." };
  }

  if (!validator.isEmail(email)) {
    return { statusCode: 400, body: "Invalid email format." };
  }

  const remoteIp = event.headers["x-nf-client-connection-ip"];
  const turnstileValid = await verifyTurnstile(turnstileToken, remoteIp);
  if (!turnstileValid) {
    return { statusCode: 400, body: "We couldn't verify you're not a robot. Please try again." };
  }

  let sessions;
  try {
    sessions = loadSessions();
  } catch (error) {
    console.error("Error reading sessions.json:", error);
    return { statusCode: 500, body: "Error loading session data." };
  }

  const session = sessions.find((s) => s.id === sessionId);

  if (!session || session.type !== "class") {
    return { statusCode: 404, body: "That session could not be found." };
  }

  const store = getStore("session-bookings");
  let result;
  try {
    result = await reserveSeat(store, session.id, session.capacity);
  } catch (error) {
    console.error("Error reserving seat:", error);
    return { statusCode: 500, body: "Error processing your booking. Please try again." };
  }

  if (!result.success) {
    const message =
      result.reason === "full"
        ? "That session is full. Please choose another date, or call us to be added to a waitlist."
        : "We couldn't process your booking due to high demand. Please try again.";
    return { statusCode: 409, body: message };
  }

  const cleanName = stripNewlines(name);
  const cleanEmail = stripNewlines(email);
  const cleanPhone = phone ? stripNewlines(phone) : "N/A";
  const cleanNotes = notes ? notes.trim() : "N/A";

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const staffMail = {
    from: process.env.EMAIL_USER,
    to: "info@bloomingmindok.com",
    replyTo: cleanEmail,
    subject: `New Booking: ${session.title} (${session.date})`,
    text: `A new booking was made for "${session.title}" on ${session.date} at ${session.time}.

Name: ${cleanName}
Email: ${cleanEmail}
Phone: ${cleanPhone}
Notes: ${cleanNotes}

Seats remaining after this booking: ${result.seatsRemaining} of ${session.capacity}

This booking was NOT added as a guest on any shared Google Calendar event, to
avoid exposing client identities to other attendees. Please add this client
to your internal calendar for this session manually.`,
  };

  const clientMail = {
    from: process.env.EMAIL_USER,
    to: cleanEmail,
    subject: `You're registered: ${session.title}`,
    text: `Hi ${cleanName},

You're confirmed for "${session.title}" on ${session.date} at ${session.time} (${session.format}).

If you need to reschedule or cancel, please call us at 918-280-9166 or reply to this email.

We look forward to seeing you.

Blooming Mind`,
  };

  try {
    await transporter.sendMail(staffMail);
    await transporter.sendMail(clientMail);
  } catch (error) {
    console.error("Error sending booking emails:", error);
    // The seat is already reserved at this point. We don't roll it back
    // over an email hiccup, since the seat count in the ledger is the
    // source of truth and staff can still see bookings via the ledger.
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: true, seatsRemaining: result.seatsRemaining }),
  };
};