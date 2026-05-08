const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || "Digital Kakeibo <onboarding@resend.dev>";

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

function buildReminderHtml({ email, prompt }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <p style="font-size: 15px; line-height: 1.8;">Hello ${email},</p>
      <p style="font-size: 15px; line-height: 1.8;">
        Your weekly kakeibo reflection is ready.
      </p>
      <blockquote style="margin: 18px 0; padding-left: 14px; border-left: 2px solid #b8454d; color: #2e4756;">
        ${prompt}
      </blockquote>
      <p style="font-size: 15px; line-height: 1.8;">
        Open the app whenever you have a quiet moment.
      </p>
    </div>
  `;
}

function buildWelcomeHtml({ email }) {
  const name = String(email).split("@")[0] || "there";
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <p style="font-size: 15px; line-height: 1.8;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 1.8;">
        Welcome to Digital Kakeibo. This space is for quiet, mindful money journaling.
      </p>
      <p style="font-size: 15px; line-height: 1.8;">
        Each week brings a gentle reflection, and each new month begins with a short close ritual.
      </p>
      <p style="font-size: 14px; line-height: 1.8; color: #2e4756; margin-top: 20px;">
        "Done is better than perfect."
      </p>
    </div>
  `;
}

async function sendWeeklyReminderEmail({ email, prompt }) {
  if (!resendClient) {
    console.log(`[reminder-email] skipped (no RESEND_API_KEY) -> ${email}`);
    return;
  }

  await resendClient.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your weekly kakeibo reflection",
    html: buildReminderHtml({ email, prompt }),
  });
}

async function sendWelcomeEmail({ email }) {
  if (!resendClient) {
    console.log(`[welcome-email] skipped (no RESEND_API_KEY) -> ${email}`);
    return;
  }

  await resendClient.emails.send({
    from: resendFrom,
    to: email,
    subject: "Welcome to Digital Kakeibo",
    html: buildWelcomeHtml({ email }),
  });
}

module.exports = { sendWeeklyReminderEmail, sendWelcomeEmail };
