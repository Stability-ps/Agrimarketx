type EmailTemplateOptions = {
  title: string;
  preview: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  alert?: string;
  success?: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agrimarketx.com";
const supportEmail = "support@agrimarketx.com";

export function brandedEmailTemplate({ title, preview, body, ctaLabel, ctaUrl, alert, success }: EmailTemplateOptions) {
  const button = ctaLabel && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:#2E7D32;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;margin-top:18px">${ctaLabel}</a>`
    : "";
  const alertBox = alert
    ? `<div style="background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;padding:12px;border-radius:8px;margin:18px 0;font-size:14px">${alert}</div>`
    : "";
  const successBox = success
    ? `<div style="background:#ecfdf3;border:1px solid #bbf7d0;color:#14532d;padding:12px;border-radius:8px;margin:18px 0;font-size:14px;font-weight:600">${success}</div>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0F172A;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
            <tr>
              <td style="padding:22px 24px;border-bottom:4px solid #2E7D32">
                <img src="${siteUrl}/agrimarketx-logo.png" alt="AgriMarketX" style="display:block;width:220px;max-width:100%;height:auto;margin-bottom:8px" />
                <div style="font-size:20px;font-weight:800;color:#2E7D32">AgriMarketX</div>
                <div style="font-size:12px;color:#64748b;margin-top:3px">Manage. Track. Trade.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#0F172A">${title}</h1>
                <div style="font-size:15px;line-height:1.65;color:#334155">${body}</div>
                ${successBox}
                ${alertBox}
                ${button}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 24px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b">
                <strong style="color:#0F172A">AgriMarketX</strong><br />
                Need help? Email <a href="mailto:${supportEmail}" style="color:#2E7D32">${supportEmail}</a><br />
                Visit <a href="${siteUrl}" style="color:#2E7D32">${siteUrl}</a><br />
                Copyright ${new Date().getFullYear()} AgriMarketX. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const emailTemplates = {
  emailVerification: (url: string) => ({
    subject: "Verify your AgriMarketX email",
    html: brandedEmailTemplate({
      title: "Verify your email address",
      preview: "Confirm your email to finish setting up AgriMarketX.",
      body: "Welcome to AgriMarketX. Please confirm your email address so we can protect your account and help you start buying, selling or managing farm records.",
      ctaLabel: "Verify Email",
      ctaUrl: url
    })
  }),
  welcome: (url = siteUrl) => ({
    subject: "Welcome to AgriMarketX",
    html: brandedEmailTemplate({
      title: "Welcome to AgriMarketX",
      preview: "Thanks for joining AgriMarketX.",
      body: "Thank you for joining AgriMarketX. The platform helps you manage farms, keep livestock and operational records, buy and sell agricultural products, and connect with farmers, suppliers and buyers across South Africa.",
      ctaLabel: "Get Started",
      ctaUrl: url,
      success: "Your account is ready."
    })
  }),
  passwordReset: (url: string) => ({
    subject: "Reset your AgriMarketX password",
    html: brandedEmailTemplate({
      title: "Reset your password",
      preview: "Use this secure link to reset your password.",
      body: "We received a request to reset your AgriMarketX password. Use the button below to choose a new password.",
      ctaLabel: "Reset Password",
      ctaUrl: url,
      alert: "For your security, this link expires soon. If you did not request this, ignore this email or contact support."
    })
  }),
  changeEmail: (url: string) => ({
    subject: "Confirm your new AgriMarketX email",
    html: brandedEmailTemplate({
      title: "Confirm your new email",
      preview: "Confirm this email change for your AgriMarketX account.",
      body: "Please confirm that you want to use this email address for your AgriMarketX account.",
      ctaLabel: "Confirm Email",
      ctaUrl: url
    })
  }),
  sellerApproved: (url = `${siteUrl}/account/verification`) => ({
    subject: "Your AgriMarketX Seller Profile Has Been Verified",
    html: brandedEmailTemplate({
      title: "Seller profile verified",
      preview: "Your AgriMarketX seller profile is verified.",
      body: "Congratulations. Your seller profile has been verified. Buyers will see a Verified badge on your profile and listings, helping build trust when you sell agricultural products, livestock, equipment or services.",
      ctaLabel: "View Verification Centre",
      ctaUrl: url,
      success: "Verified sellers can build stronger buyer confidence."
    })
  }),
  sellerRejected: (reason: string, url = `${siteUrl}/account/verification`) => ({
    subject: "AgriMarketX Seller Verification Needs Attention",
    html: brandedEmailTemplate({
      title: "Seller verification needs attention",
      preview: "Your seller verification was not approved yet.",
      body: "Your seller verification could not be approved yet. Please review the reason below, update your details, and resubmit when ready.",
      alert: reason || "Please check your farm and contact details before resubmitting.",
      ctaLabel: "Resubmit Verification",
      ctaUrl: url
    })
  })
};
