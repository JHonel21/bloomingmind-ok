const nodemailer = require("nodemailer");
const validator = require("validator");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const formData = JSON.parse(event.body);
  const { name, email, message, hasInsurance, insuranceProvider } = formData;

  if (!name || !email || !message || !hasInsurance) {
    return { statusCode: 400, body: "All required fields must be filled out." };
  }

  if (!validator.isEmail(email)) {
    return { statusCode: 400, body: "Invalid email format." };
  }

  // Strip newlines/carriage returns to prevent header injection via the
  // "from"/subject line, since name and email feed into mailOptions.
  const stripNewlines = (str) => str.replace(/[\r\n]+/g, " ").trim();

  const cleanName = stripNewlines(name);
  const cleanEmail = stripNewlines(email);
  const cleanMessage = message.trim(); // message only goes in the body, newlines are fine/expected here
  const cleanHasInsurance = stripNewlines(hasInsurance);
  const cleanInsuranceProvider = insuranceProvider ? stripNewlines(insuranceProvider) : "N/A";

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "info@bloomingmindok.com",
    replyTo: cleanEmail, // lets staff hit "reply" and go straight to the submitter
    subject: `Blooming Mind Contact Form Submission from ${cleanName}`,
    text: `Name: ${cleanName}
Email: ${cleanEmail}
Has Insurance: ${cleanHasInsurance}
Insurance Provider: ${cleanInsuranceProvider}
Message: ${cleanMessage}`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { statusCode: 500, body: `Error sending email: ${error.message}` };
  }
};