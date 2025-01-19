const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const formData = JSON.parse(event.body); // Parse form data
  const { name, email, message } = formData;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // Google Workspace email
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "your-google-workspace-email@example.com", // Replace with your email
    subject: `New Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: "Email sent successfully" };
  } catch (error) {
    return { statusCode: 500, body: `Error sending email: ${error.message}` };
  }
};