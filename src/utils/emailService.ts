import { jsPDF } from 'jspdf';

// Email service configuration
// Users can set up their own EmailJS account at https://www.emailjs.com/
// Free tier allows 200 emails/month

interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

interface EmailData {
  to: string;
  subject: string;
  message: string;
  pdfBase64?: string;
  pdfFilename?: string;
}

// Local storage key for email settings
const EMAIL_CONFIG_KEY = 'prebuild-email-config';
const EMAIL_HISTORY_KEY = 'prebuild-email-history';

// Save email configuration
export function saveEmailConfig(config: EmailConfig): void {
  localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
}

// Load email configuration
export function loadEmailConfig(): EmailConfig | null {
  const stored = localStorage.getItem(EMAIL_CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Clear email configuration
export function clearEmailConfig(): void {
  localStorage.removeItem(EMAIL_CONFIG_KEY);
}

// Save email to history
export function addToEmailHistory(email: string): void {
  const history = getEmailHistory();
  const updated = [email, ...history.filter((e) => e !== email)].slice(0, 10);
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(updated));
}

// Get email history
export function getEmailHistory(): string[] {
  const stored = localStorage.getItem(EMAIL_HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Convert jsPDF to base64
export function pdfToBase64(doc: jsPDF): string {
  return doc.output('datauristring').split(',')[1];
}

// Send email using EmailJS
export async function sendEmailWithEmailJS(
  config: EmailConfig,
  data: EmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamically load EmailJS if not already loaded
    if (!(window as unknown as { emailjs?: unknown }).emailjs) {
      await loadEmailJSScript();
    }

    const emailjs = (
      window as unknown as {
        emailjs: {
          send: (
            serviceId: string,
            templateId: string,
            params: Record<string, string>,
            publicKey: string
          ) => Promise<{ status: number; text: string }>;
        };
      }
    ).emailjs;

    const templateParams: Record<string, string> = {
      to_email: data.to,
      subject: data.subject,
      message: data.message,
    };

    if (data.pdfBase64) {
      templateParams.attachment = data.pdfBase64;
      templateParams.attachment_name = data.pdfFilename || 'prebuild-spec.pdf';
    }

    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );

    if (response.status === 200) {
      addToEmailHistory(data.to);
      return { success: true };
    }

    return { success: false, error: response.text };
  } catch (err) {
    console.error('EmailJS error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
}

// Load EmailJS script dynamically
function loadEmailJSScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="emailjs"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load EmailJS'));
    document.head.appendChild(script);
  });
}

// Open email client with pre-filled content (fallback method)
export function openEmailClient(to: string, subject: string, body: string): void {
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

// Generate email body for a prebuild spec
export function generateEmailBody(
  modelName: string,
  price: string,
  specs: Record<string, string>,
  storeName?: string
): string {
  let body = '';

  if (storeName) {
    body += `From: ${storeName}\n\n`;
  }

  body += `PC Build Specification: ${modelName}\n`;
  body += `Price: ${price}\n\n`;
  body += `SPECIFICATIONS:\n`;
  body += `─────────────────────────\n`;

  const specOrder = ['CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU', 'Case', 'Cooling'];
  specOrder.forEach((key) => {
    const value = specs[key.toLowerCase()];
    if (value) {
      body += `${key}: ${value}\n`;
    }
  });

  body += `\n─────────────────────────\n`;
  body += `\nPlease find the attached PDF spec card for more details.\n`;

  return body;
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Share via Web Share API (mobile-friendly)
export async function shareViaWebShare(
  title: string,
  text: string,
  pdfBlob?: Blob
): Promise<{ success: boolean; error?: string }> {
  if (!navigator.share) {
    return { success: false, error: 'Web Share API not supported' };
  }

  try {
    const shareData: ShareData = {
      title,
      text,
    };

    if (
      pdfBlob &&
      navigator.canShare &&
      navigator.canShare({ files: [new File([pdfBlob], 'spec.pdf')] })
    ) {
      const file = new File([pdfBlob], `${title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`, {
        type: 'application/pdf',
      });
      shareData.files = [file];
    }

    await navigator.share(shareData);
    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Share cancelled' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Share failed',
    };
  }
}
