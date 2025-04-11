const nodemailer = require("nodemailer");
const validator = require("validator");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const formData = JSON.parse(event.body);
  const { name, email, message } = formData;

  if (!name || !email || !message) {
    return { statusCode: 400, body: "All fields are required." };
  }

  if (!validator.isEmail(email)) {
    return { statusCode: 400, body: "Invalid email format." };
  }

  const sanitizedName = validator.escape(name);
  const sanitizedMessage = validator.escape(message);

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
    subject: `New Contact Form Submission from ${sanitizedName}`,
    text: `Name: ${sanitizedName}\nEmail: ${email}\nMessage: ${sanitizedMessage}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { statusCode: 500, body: `Error sending email: ${error.message}` };
  }
};
