import dotenv from "dotenv";
import nodemailer from "nodemailer";
import mg from "nodemailer-mailgun-transport";


dotenv.config();

const auth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
};

const transporter = nodemailer.createTransport(mg(auth));

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAILGUN_FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
    });
    console.log("Email sent:", info);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
