import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  loadEmailConfig,
  saveEmailConfig,
  clearEmailConfig,
  sendEmailWithEmailJS,
  openEmailClient,
  generateEmailBody,
  getEmailHistory,
  isValidEmail,
  shareViaWebShare,
  pdfToBase64,
} from '../utils/emailService';
import { PrebuildConfig, formatPrice } from '../types';

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrebuildConfig;
  pdfDoc: jsPDF | null;
  cardSize: string;
}

type SendMethod = 'emailjs' | 'mailto' | 'share';

export function EmailDialog({ isOpen, onClose, config, pdfDoc, cardSize }: EmailDialogProps) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendMethod, setSendMethod] = useState<SendMethod>('mailto');
  const [emailHistory, setEmailHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // EmailJS config
  const [showConfig, setShowConfig] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');

  // Check for Web Share API support
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Load saved config and history
  useEffect(() => {
    const savedConfig = loadEmailConfig();
    if (savedConfig) {
      setServiceId(savedConfig.serviceId);
      setTemplateId(savedConfig.templateId);
      setPublicKey(savedConfig.publicKey);
      setSendMethod('emailjs');
    }
    setEmailHistory(getEmailHistory());
  }, []);

  // Set default subject and message when dialog opens
  useEffect(() => {
    if (isOpen && config) {
      const storeName = config.storeName || 'PC Builder';
      setSubject(`${storeName} - ${config.modelName || 'PC Build'} Spec Card`);
      setMessage(
        generateEmailBody(
          config.modelName || 'PC Build',
          config.price > 0 ? formatPrice(config.price) : '',
          {
            cpu: config.components.cpu,
            gpu: config.components.gpu,
            ram: config.components.ram,
            storage: config.components.storage,
            motherboard: config.components.motherboard,
            psu: config.components.psu,
            case: config.components.case,
            cooling: config.components.cooling,
          },
          config.storeName
        )
      );
    }
  }, [isOpen, config]);

  const handleSaveConfig = () => {
    if (serviceId && templateId && publicKey) {
      saveEmailConfig({ serviceId, templateId, publicKey });
      setShowConfig(false);
      setStatus({ type: 'success', message: 'EmailJS configuration saved!' });
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const handleClearConfig = () => {
    clearEmailConfig();
    setServiceId('');
    setTemplateId('');
    setPublicKey('');
    setSendMethod('mailto');
    setShowConfig(false);
  };

  const handleSend = async () => {
    if (!toEmail || !isValidEmail(toEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setStatus(null);
    setSending(true);

    try {
      if (sendMethod === 'emailjs') {
        const emailConfig = loadEmailConfig();
        if (!emailConfig) {
          setStatus({ type: 'error', message: 'Please configure EmailJS first' });
          setSending(false);
          return;
        }

        const pdfBase64 = pdfDoc ? pdfToBase64(pdfDoc) : undefined;

        const result = await sendEmailWithEmailJS(emailConfig, {
          to: toEmail,
          subject,
          message,
          pdfBase64,
          pdfFilename: `${config.modelName || 'prebuild'}-${cardSize}.pdf`,
        });

        if (result.success) {
          setStatus({ type: 'success', message: 'Email sent successfully!' });
          setEmailHistory(getEmailHistory());
          setTimeout(() => {
            onClose();
            setStatus(null);
          }, 1500);
        } else {
          setStatus({ type: 'error', message: result.error || 'Failed to send email' });
        }
      } else if (sendMethod === 'share' && canShare) {
        const pdfBlob = pdfDoc ? pdfDoc.output('blob') : undefined;
        const result = await shareViaWebShare(subject, message, pdfBlob);

        if (result.success) {
          setStatus({ type: 'success', message: 'Shared successfully!' });
          setTimeout(() => {
            onClose();
            setStatus(null);
          }, 1500);
        } else if (result.error !== 'Share cancelled') {
          setStatus({ type: 'error', message: result.error || 'Share failed' });
        }
      } else {
        // Mailto fallback
        openEmailClient(toEmail, subject, message);
        setStatus({
          type: 'success',
          message: 'Email client opened. Please attach the PDF manually after downloading.',
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'An error occurred',
      });
    }

    setSending(false);
  };

  const handleSelectHistory = (email: string) => {
    setToEmail(email);
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Email Spec Card</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Send Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send Method</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSendMethod('mailto')}
                className={`flex-1 px-3 py-2 text-sm rounded-md border-2 transition-colors ${
                  sendMethod === 'mailto'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Email Client</div>
                <div className="text-xs text-gray-500">Opens your email app</div>
              </button>

              {canShare && (
                <button
                  onClick={() => setSendMethod('share')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border-2 transition-colors ${
                    sendMethod === 'share'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Share</div>
                  <div className="text-xs text-gray-500">Native share menu</div>
                </button>
              )}

              <button
                onClick={() => setSendMethod('emailjs')}
                className={`flex-1 px-3 py-2 text-sm rounded-md border-2 transition-colors ${
                  sendMethod === 'emailjs'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Direct Send</div>
                <div className="text-xs text-gray-500">Via EmailJS</div>
              </button>
            </div>
          </div>

          {/* EmailJS Configuration */}
          {sendMethod === 'emailjs' && (
            <div className="bg-gray-50 rounded-md p-3">
              {showConfig ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Configure your{' '}
                    <a
                      href="https://www.emailjs.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      EmailJS
                    </a>{' '}
                    account (free tier: 200 emails/month)
                  </p>
                  <input
                    type="text"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder="Service ID"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="Template ID"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="Public Key"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveConfig}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Config
                    </button>
                    <button
                      onClick={() => setShowConfig(false)}
                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    {loadEmailConfig() && (
                      <button
                        onClick={handleClearConfig}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              ) : loadEmailConfig() ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">EmailJS configured</span>
                  <button
                    onClick={() => setShowConfig(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">EmailJS not configured</span>
                  <button
                    onClick={() => setShowConfig(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Configure
                  </button>
                </div>
              )}
            </div>
          )}

          {/* To Email */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              onFocus={() => emailHistory.length > 0 && setShowHistory(true)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showHistory && emailHistory.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1">
                  <div className="px-3 py-1 text-xs text-gray-500">Recent</div>
                  {emailHistory.map((email) => (
                    <button
                      key={email}
                      onClick={() => handleSelectHistory(email)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      {email}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* PDF Attachment Info */}
          {pdfDoc && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md text-sm">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-blue-700">
                {sendMethod === 'mailto'
                  ? 'PDF will need to be attached manually'
                  : `PDF attached: ${config.modelName || 'prebuild'}-${cardSize}.pdf`}
              </span>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div
              className={`p-3 rounded-md text-sm ${
                status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !toEmail}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {sendMethod === 'mailto'
                  ? 'Open Email'
                  : sendMethod === 'share'
                    ? 'Share'
                    : 'Send Email'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
