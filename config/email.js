const nodemailer = require("nodemailer");

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter verification failed:", error.message);
  } else {
    console.log("✅ Email transporter is ready to send emails");
  }
});

const sendPasswordResetEmail = async (email, otp) => {
  try {

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Finance Tracker - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #059669; margin: 0;">Finance Tracker</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              We received a request to reset your Finance Tracker password. Use the OTP below to reset it.
            </p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              <strong>Your OTP Code:</strong>
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <span style="background-color: #f3f4f6; padding: 15px 30px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6;">
              This code will expire in <strong>15 minutes</strong>. If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© 2026 Finance Tracker. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Failed to send password reset email");
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Finance Tracker",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #059669; margin: 0;">Finance Tracker</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937;">Welcome, ${name}!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for joining Finance Tracker. Your account has been created successfully.
            </p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              You can now log in and start managing your finances effectively.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Login
              </a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© 2026 Finance Tracker. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error.message);
    throw new Error("Failed to send welcome email");
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
