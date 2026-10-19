const validator = require("validator");
const { verifyTurnstile } = require("./lib/verify-turnstile");
const { findProgram } = require("./lib/program-catalog");
const {
  stripNewlines,
  parseBody,
  withinLength,
  createTransporter,
} = require("./lib/mailer");

// Handles inquiries for both Group Programs and 8-Hour Intensives. The
// "program" value from the page is only a key into the catalog built from
// public/data/*.json, so a tampered value is rejected instead of being
// echoed into an email subject.

const FORMATS = ["In person (Jenks)", "Telehealth", "Not sure yet"];
const ANY_DATE = "any";

const LIMITS = { name: 100, email: 254, phone: 25, message: 3000 };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = parseBody(event);
  if (!data) {
    return { statusCode: 400, body: "Invalid request body." };
  }

  const {
    program,
    name,
    email,
    phone,
    preferredFormat,
    preferredDate,
    message,
    consent,
    botField,
    turnstileToken,
  } = data;

  // Honeypot: silently pretend success so bots don't learn to look elsewhere.
  if (botField) {
    return { statusCode: 200, body: "OK" };
  }

  const selected = findProgram(program);
  if (!selected) {
    return { statusCode: 400, body: "That program could not be found." };
  }

  if (!name || !email) {
    return { statusCode: 400, body: "Name and email are required." };
  }

  if (consent !== true) {
    return { statusCode: 400, body: "Please agree to the Privacy Policy and Terms and Conditions." };
  }

  if (
    !withinLength(name, LIMITS.name) ||
    !withinLength(email, LIMITS.email) ||
    (phone && !withinLength(phone, LIMITS.phone)) ||
    (message && !withinLength(message, LIMITS.message))
  ) {
    return { statusCode: 400, body: "One or more fields are too long." };
  }

  if (!validator.isEmail(email)) {
    return { statusCode: 400, body: "Invalid email format." };
  }

  if (phone && !/^[0-9+()\-.\s]{7,25}$/.test(phone.trim())) {
    return { statusCode: 400, body: "Please enter a valid phone number." };
  }

  if (preferredFormat && !FORMATS.includes(preferredFormat)) {
    return { statusCode: 400, body: "Invalid format selection." };
  }

  // Preferred date only applies to intensives, and must be one of the dates
  // currently listed for that intensive (or "any").
  let dateLine = "";
  if (selected.kind === "intensive" && preferredDate) {
    if (preferredDate === ANY_DATE) {
      dateLine = "No preference, notify me of future dates";
    } else {
      const match = selected.dates.find((d) => d.date === preferredDate);
      if (!match) {
        return { statusCode: 400, body: "That date is no longer available. Please choose another." };
      }
      dateLine = [match.date, match.time, match.format].filter(Boolean).join(" | ");
    }
  }

  const remoteIp = event.headers["x-nf-client-connection-ip"];
  const turnstileValid = await verifyTurnstile(turnstileToken, remoteIp);
  if (!turnstileValid) {
    return { statusCode: 400, body: "We couldn't verify you're not a robot. Please try again." };
  }

  const cleanName = stripNewlines(name);
  const cleanEmail = stripNewlines(email);
  const cleanPhone = phone ? stripNewlines(phone) : "Not provided";
  const cleanFormat = preferredFormat || "Not specified";
  const cleanMessage = message && message.trim() ? message.trim() : "None provided";
  const cleanTitle = stripNewlines(selected.title);

  const submittedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Routed separately from the general contact form. Set PROGRAM_INQUIRY_TO in
  // Netlify to send these to a different mailbox (for example the intake
  // coordinator). Falls back to the main office inbox.
  const recipient = process.env.PROGRAM_INQUIRY_TO || "info@bloomingmindok.com";

  const isIntensive = selected.kind === "intensive";
  // The bracketed prefix makes the intent obvious at a glance and gives a
  // stable string for a Gmail filter or label.
  const tag = isIntensive ? "[Intensive Inquiry]" : "[Group Inquiry]";
  const heading = isIntensive
    ? "INTENSIVE INQUIRY (not a general contact form message)"
    : "GROUP PROGRAM INQUIRY (not a general contact form message)";
  const requested = isIntensive
    ? "consult / intake for this intensive"
    : "interest in this group (spot, interest list, or waitlist)";

  const lines = [
    heading,
    "",
    `Program: ${cleanTitle}`,
    `Requested: ${requested}`,
  ];
  if (selected.schedule) lines.push(`Listed schedule: ${stripNewlines(selected.schedule)}`);
  if (dateLine) lines.push(`Preferred date: ${dateLine}`);
  lines.push(
    `Submitted: ${submittedAt} (Central)`,
    "",
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Phone: ${cleanPhone}`
  );
  if (isIntensive) lines.push(`Preferred format: ${cleanFormat}`);
  lines.push(
    "",
    "Message:",
    cleanMessage,
    "",
    "Next step: reach out to follow up. Reply to this email to respond directly to the sender."
  );

  const mailOptions = {
    from: `"Blooming Mind Website" <${process.env.EMAIL_USER}>`,
    to: recipient,
    replyTo: cleanEmail,
    subject: `${tag} ${cleanTitle}: ${cleanName}`,
    text: lines.join("\n"),
  };

  try {
    await createTransporter().sendMail(mailOptions);
    return { statusCode: 200, body: "Inquiry sent successfully" };
  } catch (error) {
    console.error("Error sending program inquiry:", error);
    return {
      statusCode: 500,
      body: "We couldn't send your inquiry right now. Please call us at 918-280-9166.",
    };
  }
};
