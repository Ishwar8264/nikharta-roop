import "server-only";

import { siteConfig } from "@/config/site";

interface AuthEmailMessage {
  subject: string;
  html: string;
  text: string;
}

interface AuthEmailContent {
  preheader: string;
  eyebrow: string;
  title: string;
  description: string;
  code: string;
  securityMessage: string;
}

/** Creates every representation required for an email-verification message. */
export function createOtpEmail(code: string): AuthEmailMessage {
  return {
    subject: `${code} is your ${siteConfig.name} verification code`,
    html: renderAuthEmail({
      preheader: `Your ${siteConfig.name} verification code is ${code}. It expires in 10 minutes.`,
      eyebrow: "Account verification",
      title: "Verify your email",
      description:
        "Welcome to Nikharta Roop. Enter this one-time code to finish creating your account.",
      code,
      securityMessage:
        "If you did not create a Nikharta Roop account, you can safely ignore this email.",
    }),
    text: `${siteConfig.name}\n\nVerify your email\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you did not create a ${siteConfig.name} account, you can safely ignore this email.\n\nNeed help? ${siteConfig.contact.email}`,
  };
}

/** Creates every representation required for a password-reset message. */
export function createPasswordResetEmail(code: string): AuthEmailMessage {
  return {
    subject: `${code} is your ${siteConfig.name} password reset code`,
    html: renderAuthEmail({
      preheader: `Your ${siteConfig.name} password reset code is ${code}. It expires in 10 minutes.`,
      eyebrow: "Password recovery",
      title: "Reset your password",
      description:
        "We received a request to reset your password. Enter this one-time code to continue.",
      code,
      securityMessage:
        "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    }),
    text: `${siteConfig.name}\n\nReset your password\n\nYour password reset code is: ${code}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.\n\nNeed help? ${siteConfig.contact.email}`,
  };
}

/** Builds the shared email-client-safe shell for authentication messages. */
function renderAuthEmail(content: AuthEmailContent): string {
  const logoUrl = new URL(
    "/brand/logo/nikharta-roop-mark-light-512.png",
    siteConfig.url,
  ).toString();
  const websiteUrl = new URL("/", siteConfig.url).toString();
  const spacedCode = content.code.split("").join("&nbsp;");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>${content.title}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f8f3ed; color:#321827; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; line-height:1px; mso-hide:all;">
          ${content.preheader}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#f8f3ed;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
                <tr>
                  <td style="height:6px; background-color:#b8425b; border-radius:18px 18px 0 0; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="background-color:#ffffff; border-right:1px solid #eadfd7; border-left:1px solid #eadfd7; padding:28px 32px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle; padding-right:12px;">
                          <img src="${logoUrl}" width="58" height="58" alt="" style="display:block; width:58px; height:58px; object-fit:contain; border:0;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <a href="${websiteUrl}" style="color:#321827; font-family:Georgia,'Times New Roman',serif; font-size:24px; line-height:30px; font-weight:700; text-decoration:none;">${siteConfig.name}</a>
                          <div style="color:#8a6f7c; font-size:11px; line-height:16px; letter-spacing:1.6px; text-transform:uppercase;">Beauty, thoughtfully booked</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#ffffff; border-right:1px solid #eadfd7; border-left:1px solid #eadfd7; padding:8px 32px 36px;">
                    <div style="display:inline-block; margin-bottom:14px; color:#b8425b; font-size:12px; line-height:18px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">${content.eyebrow}</div>
                    <h1 style="margin:0 0 14px; color:#321827; font-family:Georgia,'Times New Roman',serif; font-size:34px; line-height:42px; font-weight:700;">${content.title}</h1>
                    <p style="margin:0; max-width:500px; color:#69545f; font-size:16px; line-height:26px;">${content.description}</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-top:28px;">
                      <tr>
                        <td align="center" style="background-color:#fdf7f4; border:1px solid #efd7d8; border-radius:14px; padding:26px 16px 24px;">
                          <div style="margin-bottom:10px; color:#8a6f7c; font-size:11px; line-height:16px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase;">Your one-time code</div>
                          <div style="color:#4a1731; font-family:'Courier New',Courier,monospace; font-size:38px; line-height:46px; font-weight:700; letter-spacing:5px; white-space:nowrap;">${spacedCode}</div>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
                      <tr>
                        <td style="vertical-align:top; padding-right:10px; color:#c99b3b; font-size:18px; line-height:22px;">&#9679;</td>
                        <td style="color:#69545f; font-size:14px; line-height:22px;">
                          This code expires in <strong style="color:#321827;">10 minutes</strong> and can only be used once.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#4a1731; border-radius:0 0 18px 18px; padding:24px 32px;">
                    <p style="margin:0 0 14px; color:#f7e9eb; font-size:13px; line-height:21px;">${content.securityMessage}</p>
                    <p style="margin:0; color:#d8bdc8; font-size:12px; line-height:19px;">
                      Need help? Contact <a href="mailto:${siteConfig.contact.email}" style="color:#f1c86b; text-decoration:none;">${siteConfig.contact.email}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 24px 0; color:#927d86; font-size:11px; line-height:18px;">
                    &copy; ${new Date().getUTCFullYear()} ${siteConfig.name}. Secure salon booking, made beautiful.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
