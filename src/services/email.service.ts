import nodemailer from "nodemailer";
import { env } from "../config/env";

// Escape values that originate from user input before interpolating them into
// the HTML email body.
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: parseInt(env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendOrderEmail = async (order: any) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn("⚠️ SMTP credentials not provided. Skipping email sending.");
    return;
  }

  const productList = order.produits
    .map(
      (p: any) =>
        `- ${p.quantity}x ${p.nom} (${p.prix} FCFA) = ${p.prix * p.quantity} FCFA`
    )
    .join("\n");

  const mailOptions = {
    from: `"VigneBBK" <${env.SMTP_USER}>`,
    to: env.ADMIN_EMAIL,
    subject: `Nouvelle Commande #${order.id} - ${order.total} FCFA`,
    text: `
Une nouvelle commande a été passée sur le site (Version PC).

Détails de la commande :
------------------------
ID: ${order.id}
Client: ${order.telephone}
Adresse: ${order.adresse}

Produits:
${productList}

Total: ${order.total} FCFA
------------------------

Connectez-vous au dashboard pour traiter la commande.
    `,
    html: `
      <h2>Nouvelle Commande #${order.id}</h2>
      <p><strong>Client:</strong> ${escapeHtml(order.telephone)}</p>
      <p><strong>Adresse:</strong> ${escapeHtml(order.adresse)}</p>

      <h3>Produits:</h3>
      <ul>
        ${order.produits
          .map(
            (p: any) =>
              `<li>${escapeHtml(p.quantity)}x <strong>${escapeHtml(p.nom)}</strong> - ${p.prix * p.quantity} FCFA</li>`
          )
          .join("")}
      </ul>
      
      <h3>Total: ${order.total} FCFA</h3>
      <br>
      <a href="${env.CORS_ORIGIN}/admin/orders/${order.id}">Voir la commande</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Order email sent to ${env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

export const send2FACode = async (email: string, code: string) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn("⚠️ SMTP credentials not provided. Skipping email sending.");
    return;
  }

  const mailOptions = {
    from: `"VigneBBK Security" <${env.SMTP_USER}>`,
    to: email,
    subject: `Code de vérification : ${code}`,
    text: `Votre code de vérification pour l'accès administrateur est : ${code}. Ce code expire dans 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #810b15;">Vérification en deux étapes</h2>
        <p>Bonjour,</p>
        <p>Voici votre code de vérification pour accéder à l'interface d'administration :</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">
          ${code}
        </div>
        <p>Ce code est valable pendant <strong>10 minutes</strong>.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 2FA code sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending 2FA email:", error);
    // Log detailed error if available
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack:", error.stack);
    }
    throw new Error("Erreur lors de l'envoi de l'email");
  }
};
