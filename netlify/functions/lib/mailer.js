// Shared helpers for the email-sending Netlify Functions, so every form
// handler validates and sends mail the same way.
const nodemailer = require("nodemailer");

// Strip newlines/carriage returns from any value that ends up in an email
// header (subject, replyTo, from). Prevents header injection.
function stripNewlines(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

// Returns the parsed JSON object, or null if the body is missing, malformed,
// or not a plain object. Callers should answer 400 on null.
function parseBody(event) {
  try {
    const parsed = JSON.parse(event.body || "");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch (error) {
    return null;
  }
}

// True if value is a string within max characters (after trimming).
function withinLength(value, max) {
  return typeof value === "string" && value.trim().length <= max;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

module.exports = { stripNewlines, parseBody, withinLength, createTransporter };