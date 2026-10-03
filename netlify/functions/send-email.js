const validator = require("validator");
const { verifyTurnstile } = require("./lib/verify-turnstile");
const {
  stripNewlines,
  parseBody,
  withinLength,
  createTransporter,
} = require("./lib/mailer");

const LIMITS = { name: 100, email: 254, message: 5000, insuranceProvider: 200 };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const formData = parseBody(event);
  if (!formData) {
    return { statusCode: 400, body: "Invalid request body." };
  }

  const { name, email, message, hasInsurance, insuranceProvider, botField, turnstileToken } = formData;

  // Honeypot: real visitors never see or fill this in. If it has a value,
  // silently pretend success so bots don't learn to look elsewhere.
  if (botField) {
    return { statusCode: 200, body: "OK" };
  }

  if (!name || !email || !message || !hasInsurance) {
    return { statusCode: 400, body: "All required fields must be filled out." };
  }

  if (
    !withinLength(name, LIMITS.name) ||
    !withinLength(email, LIMITS.email) ||
    !withinLength(message, LIMITS.message) ||
    (insuranceProvider && !withinLength(insuranceProvider, LIMITS.insuranceProvider))
  ) {
    return { statusCode: 400, body: "One or more fields are too long." };
  }

  if (!["Yes", "No"].includes(hasInsurance)) {
    return { statusCode: 400, body: "Invalid insurance selection." };
  }

  if (!validator.isEmail(email)) {
    return { statusCode: 400, body: "Invalid email format." };
  }

  const remoteIp = event.headers["x-nf-client-connection-ip"];
  const turnstileValid = await verifyTurnstile(turnstileToken, remoteIp);
  if (!turnstileValid) {
    return { statusCode: 400, body: "We couldn't verify you're not a robot. Please try again." };
  }

  const cleanName = stripNewlines(name);
  const cleanEmail = stripNewlines(email);
  const cleanMessage = message.trim(); // body only, newlines are expected here
  const cleanInsuranceProvider = insuranceProvider ? stripNewlines(insuranceProvider) : "N/A";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "info@bloomingmindok.com",
    replyTo: cleanEmail, // staff can hit "reply" and go straight to the submitter
    subject: `Blooming Mind Contact Form Submission from ${cleanName}`,
    text: `Name: ${cleanName}
Email: ${cleanEmail}
Has Insurance: ${hasInsurance}
Insurance Provider: ${cleanInsuranceProvider}
Message: ${cleanMessage}`,
  };

  try {
    await createTransporter().sendMail(mailOptions);
    return { statusCode: 200, body: "Email sent successfully" };
  } catch (error) {
    // Full detail stays in the Netlify function log. The visitor gets a
    // generic message so SMTP internals are never exposed to the browser.
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      body: "We couldn't send your message right now. Please call us at 918-280-9166.",
    };
  }
};