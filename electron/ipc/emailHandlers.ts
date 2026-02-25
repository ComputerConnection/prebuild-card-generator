import { ipcMain } from 'electron';
import nodemailer from 'nodemailer';
import type { SmtpConfig, EmailMessage } from '../types';
import { saveEncryptedCredential, getEncryptedCredential } from './storeHandlers';

const SMTP_CONFIG_KEY = 'smtp-config';

export function registerEmailHandlers(): void {
  // ── Send email ───────────────────────────────────────────
  ipcMain.handle(
    'email:send',
    async (_event, config: SmtpConfig, message: EmailMessage) => {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        });

        const attachments = message.attachments?.map((att) => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
        }));

        const result = await transporter.sendMail({
          from: config.user,
          to: message.to,
          subject: message.subject,
          text: message.body,
          attachments,
        });

        return { success: true, messageId: result.messageId };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to send email',
        };
      }
    }
  );

  // ── Test SMTP connection ─────────────────────────────────
  ipcMain.handle(
    'email:testConnection',
    async (_event, config: SmtpConfig) => {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        });

        await transporter.verify();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Connection failed',
        };
      }
    }
  );

  // ── Get saved SMTP config ────────────────────────────────
  ipcMain.handle('email:getSavedConfig', () => {
    const host = getEncryptedCredential(`${SMTP_CONFIG_KEY}-host`);
    const port = getEncryptedCredential(`${SMTP_CONFIG_KEY}-port`);
    const secure = getEncryptedCredential(`${SMTP_CONFIG_KEY}-secure`);
    const user = getEncryptedCredential(`${SMTP_CONFIG_KEY}-user`);
    const pass = getEncryptedCredential(`${SMTP_CONFIG_KEY}-pass`);

    if (!host || !user) return null;

    return {
      host,
      port: port ? parseInt(port, 10) : 587,
      secure: secure === 'true',
      user,
      pass: pass || '',
    } satisfies SmtpConfig;
  });

  // ── Save SMTP config (encrypted) ────────────────────────
  ipcMain.handle('email:saveConfig', (_event, config: SmtpConfig) => {
    saveEncryptedCredential(`${SMTP_CONFIG_KEY}-host`, config.host);
    saveEncryptedCredential(`${SMTP_CONFIG_KEY}-port`, String(config.port));
    saveEncryptedCredential(`${SMTP_CONFIG_KEY}-secure`, String(config.secure));
    saveEncryptedCredential(`${SMTP_CONFIG_KEY}-user`, config.user);
    saveEncryptedCredential(`${SMTP_CONFIG_KEY}-pass`, config.pass);
  });
}
