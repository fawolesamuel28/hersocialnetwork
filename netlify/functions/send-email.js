const nodemailer = require("nodemailer");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { firstName, lastName, email, phone, message, type } = JSON.parse(event.body);

    if (!firstName || !email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const isCallRequest = type === "call";
    const subject = isCallRequest
      ? `📞 Call Request from ${firstName} ${lastName} — Her Social Network`
      : `✉️ New Message from ${firstName} ${lastName} — Her Social Network`;

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1b4b47; padding: 24px; text-align: center;">
          <h1 style="color: #fff; font-size: 1.4rem; margin: 0;">Her Social Network CIC</h1>
          <p style="color: #e2992f; margin: 6px 0 0; font-size: 0.9rem;">${isCallRequest ? "Call Back Request" : "New Contact Form Submission"}</p>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #555; width: 140px;"><strong>Name</strong></td>
              <td style="padding: 8px 0;">${escapeHtml(firstName)} ${escapeHtml(lastName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #555;"><strong>Email</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; color: #555;"><strong>Phone</strong></td>
              <td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td>
            </tr>` : ""}
            <tr>
              <td style="padding: 8px 0; color: #555;"><strong>Type</strong></td>
              <td style="padding: 8px 0;">${isCallRequest ? "📞 Call Request" : "✉️ Email Enquiry"}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #555; margin-bottom: 8px;"><strong>${isCallRequest ? "Preferred Time / Details" : "Message"}</strong></p>
          <p style="background: #f9f9f7; padding: 16px; border-radius: 8px; white-space: pre-wrap; color: #333;">${escapeHtml(message)}</p>
        </div>
        <div style="background: #f4f2eb; padding: 16px; text-align: center; font-size: 0.8rem; color: #888;">
          Sent via Her Social Network CIC Website Contact Form &bull; hersocialnetworkcic.uk
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Her Social Network Website" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject,
      html: htmlBody,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email sent" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send email" }),
    };
  }
};

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
