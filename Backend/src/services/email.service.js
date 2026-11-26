const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// 1. Create a transporter object
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send message");
  }
});

const sendWelcomeEmail = async (recipientEmail, recipientName) => {
  try {
    const templatePath = path.join(__dirname, "template.html");
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    htmlContent = htmlContent
      .replace("{{name}}", recipientName)
      .replace("{{email}}", recipientEmail)
      .replace("{{action_url}}", process.env.FRONTEND_URL || "http://localhost:5173");

    const mailOptions = {
      from: `"Dar-ul-Ameen" <${process.env.GOOGLE_USER || "darulameenglobal@gmail.com"}>`,
      to: recipientEmail,
      subject: "Welcome to Dar-ul-Ameen!",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendInvitationEmail = async (recipientEmail, inviterName, inviteLink) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Dar-ul-Ameen</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Online 1v1 Learning Platform</p>
        </div>
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">You're Invited by ${inviterName}!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join Dar-ul-Ameen for personalized 1v1 classes.
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Experience top qualified tutors, flexible scheduling, and 1v1 learning tailored specifically for you.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${inviteLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Join & Claim Free Trial
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
            Or copy and paste this link in your browser:<br/>
            <a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a>
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Dar-ul-Ameen. All rights reserved.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"Dar-ul-Ameen" <${process.env.GOOGLE_USER || "darulameenglobal@gmail.com"}>`,
      to: recipientEmail,
      subject: `${inviterName} invited you to join Dar-ul-Ameen for 1v1 Classes!`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Invitation email sent successfully! Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending invitation email:", error.message);
    return null;
  }
};

sendWelcomeEmail.sendWelcomeEmail = sendWelcomeEmail;
sendWelcomeEmail.sendInvitationEmail = sendInvitationEmail;

module.exports = sendWelcomeEmail;
