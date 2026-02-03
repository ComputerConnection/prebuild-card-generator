/**
 * Tests for src/utils/emailService.ts
 * Tests email configuration persistence, history, and validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { jsPDF } from 'jspdf';
import {
  saveEmailConfig,
  loadEmailConfig,
  clearEmailConfig,
  addToEmailHistory,
  getEmailHistory,
  pdfToBase64,
  sendEmailWithEmailJS,
  openEmailClient,
  generateEmailBody,
  isValidEmail,
  shareViaWebShare,
} from '../../../utils/emailService';

describe('emailService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Email configuration persistence', () => {
    const testConfig = {
      serviceId: 'service_123',
      templateId: 'template_456',
      publicKey: 'public_789',
    };

    describe('saveEmailConfig', () => {
      it('should save config to localStorage', () => {
        saveEmailConfig(testConfig);

        const stored = localStorage.getItem('prebuild-email-config');
        expect(stored).toBeDefined();
        expect(JSON.parse(stored!)).toEqual(testConfig);
      });
    });

    describe('loadEmailConfig', () => {
      it('should load config from localStorage', () => {
        localStorage.setItem('prebuild-email-config', JSON.stringify(testConfig));

        const loaded = loadEmailConfig();
        expect(loaded).toEqual(testConfig);
      });

      it('should return null when no config stored', () => {
        const loaded = loadEmailConfig();
        expect(loaded).toBeNull();
      });

      it('should return null for invalid JSON', () => {
        localStorage.setItem('prebuild-email-config', 'invalid json');

        const loaded = loadEmailConfig();
        expect(loaded).toBeNull();
      });
    });

    describe('clearEmailConfig', () => {
      it('should remove config from localStorage', () => {
        localStorage.setItem('prebuild-email-config', JSON.stringify(testConfig));

        clearEmailConfig();

        expect(localStorage.getItem('prebuild-email-config')).toBeNull();
      });
    });
  });

  describe('Email history', () => {
    describe('addToEmailHistory', () => {
      it('should add email to history', () => {
        addToEmailHistory('test@example.com');

        const history = getEmailHistory();
        expect(history).toContain('test@example.com');
      });

      it('should add new email at the beginning', () => {
        addToEmailHistory('first@example.com');
        addToEmailHistory('second@example.com');

        const history = getEmailHistory();
        expect(history[0]).toBe('second@example.com');
        expect(history[1]).toBe('first@example.com');
      });

      it('should move duplicate email to front instead of adding', () => {
        addToEmailHistory('test@example.com');
        addToEmailHistory('other@example.com');
        addToEmailHistory('test@example.com');

        const history = getEmailHistory();
        expect(history.length).toBe(2);
        expect(history[0]).toBe('test@example.com');
      });

      it('should limit history to 10 entries', () => {
        // Add 12 emails
        for (let i = 1; i <= 12; i++) {
          addToEmailHistory(`test${i}@example.com`);
        }

        const history = getEmailHistory();
        expect(history.length).toBe(10);
        expect(history[0]).toBe('test12@example.com');
        expect(history).not.toContain('test1@example.com');
        expect(history).not.toContain('test2@example.com');
      });
    });

    describe('getEmailHistory', () => {
      it('should return empty array when no history', () => {
        const history = getEmailHistory();
        expect(history).toEqual([]);
      });

      it('should return empty array for invalid JSON', () => {
        localStorage.setItem('prebuild-email-history', 'invalid json');

        const history = getEmailHistory();
        expect(history).toEqual([]);
      });

      it('should return stored history', () => {
        const emails = ['a@test.com', 'b@test.com'];
        localStorage.setItem('prebuild-email-history', JSON.stringify(emails));

        const history = getEmailHistory();
        expect(history).toEqual(emails);
      });
    });
  });

  describe('pdfToBase64', () => {
    it('should convert jsPDF to base64 string', () => {
      const doc = new jsPDF();
      doc.text('Test PDF', 10, 10);

      const base64 = pdfToBase64(doc);

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
      // Should not include the data URI prefix
      expect(base64).not.toContain('data:');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user domain.com')).toBe(false);
    });
  });

  describe('generateEmailBody', () => {
    it('should generate email body with model name and price', () => {
      const body = generateEmailBody('Gaming PC Pro', '$1,499', {
        cpu: 'Intel Core i9',
        gpu: 'NVIDIA RTX 4090',
      });

      expect(body).toContain('Gaming PC Pro');
      expect(body).toContain('$1,499');
    });

    it('should include store name when provided', () => {
      const body = generateEmailBody('Gaming PC', '$999', { cpu: 'AMD Ryzen' }, 'Tech Store');

      expect(body).toContain('From: Tech Store');
    });

    it('should not include store name when not provided', () => {
      const body = generateEmailBody('Gaming PC', '$999', { cpu: 'AMD Ryzen' });

      expect(body).not.toContain('From:');
    });

    it('should include specs in correct order', () => {
      const specs = {
        cpu: 'Intel Core i9',
        gpu: 'NVIDIA RTX 4090',
        ram: '32GB DDR5',
        storage: '2TB NVMe',
        motherboard: 'ASUS ROG',
        psu: '850W Gold',
        case: 'NZXT H7',
        cooling: '360mm AIO',
      };

      const body = generateEmailBody('PC Build', '$2,000', specs);

      // Check that specs are present
      expect(body).toContain('CPU: Intel Core i9');
      expect(body).toContain('GPU: NVIDIA RTX 4090');
      expect(body).toContain('RAM: 32GB DDR5');
      expect(body).toContain('Storage: 2TB NVMe');
      expect(body).toContain('Motherboard: ASUS ROG');
      expect(body).toContain('PSU: 850W Gold');
      expect(body).toContain('Case: NZXT H7');
      expect(body).toContain('Cooling: 360mm AIO');
    });

    it('should skip empty specs', () => {
      const specs = {
        cpu: 'Intel Core i9',
        gpu: '',
        ram: '32GB DDR5',
      };

      const body = generateEmailBody('PC Build', '$1,000', specs);

      expect(body).toContain('CPU: Intel Core i9');
      expect(body).not.toContain('GPU:');
      expect(body).toContain('RAM: 32GB DDR5');
    });

    it('should include PDF attachment note', () => {
      const body = generateEmailBody('PC', '$500', {});

      expect(body).toContain('attached PDF');
    });
  });

  describe('openEmailClient', () => {
    it('should construct correct mailto URL', () => {
      const locationHrefSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        href: '',
      } as Location);

      // Track what href was set to
      let setHref = '';
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...window.location,
          set href(val: string) {
            setHref = val;
          },
        },
      });

      openEmailClient('test@example.com', 'Test Subject', 'Test Body');

      expect(setHref).toContain('mailto:');
      expect(setHref).toContain('test%40example.com');
      expect(setHref).toContain('subject=Test%20Subject');
      expect(setHref).toContain('body=Test%20Body');

      locationHrefSpy.mockRestore();
    });
  });

  describe('sendEmailWithEmailJS', () => {
    it('should return success when EmailJS sends successfully', async () => {
      // Mock emailjs on window
      const mockSend = vi.fn().mockResolvedValue({ status: 200, text: 'OK' });
      (window as unknown as { emailjs: { send: typeof mockSend } }).emailjs = {
        send: mockSend,
      };

      const config = {
        serviceId: 'service_123',
        templateId: 'template_456',
        publicKey: 'public_789',
      };

      const result = await sendEmailWithEmailJS(config, {
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        'service_123',
        'template_456',
        expect.objectContaining({
          to_email: 'test@example.com',
          subject: 'Test',
          message: 'Test message',
        }),
        'public_789'
      );

      // Cleanup
      delete (window as unknown as { emailjs?: unknown }).emailjs;
    });

    it('should include PDF attachment when provided', async () => {
      const mockSend = vi.fn().mockResolvedValue({ status: 200, text: 'OK' });
      (window as unknown as { emailjs: { send: typeof mockSend } }).emailjs = {
        send: mockSend,
      };

      const config = {
        serviceId: 'service_123',
        templateId: 'template_456',
        publicKey: 'public_789',
      };

      await sendEmailWithEmailJS(config, {
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        pdfBase64: 'base64data',
        pdfFilename: 'spec.pdf',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          attachment: 'base64data',
          attachment_name: 'spec.pdf',
        }),
        expect.anything()
      );

      delete (window as unknown as { emailjs?: unknown }).emailjs;
    });

    it('should return error when EmailJS fails', async () => {
      const mockSend = vi.fn().mockResolvedValue({ status: 400, text: 'Bad Request' });
      (window as unknown as { emailjs: { send: typeof mockSend } }).emailjs = {
        send: mockSend,
      };

      const config = {
        serviceId: 'service_123',
        templateId: 'template_456',
        publicKey: 'public_789',
      };

      const result = await sendEmailWithEmailJS(config, {
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad Request');

      delete (window as unknown as { emailjs?: unknown }).emailjs;
    });

    it('should handle exceptions', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('Network error'));
      (window as unknown as { emailjs: { send: typeof mockSend } }).emailjs = {
        send: mockSend,
      };

      const config = {
        serviceId: 'service_123',
        templateId: 'template_456',
        publicKey: 'public_789',
      };

      const result = await sendEmailWithEmailJS(config, {
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');

      delete (window as unknown as { emailjs?: unknown }).emailjs;
    });

    it('should add to email history on success', async () => {
      const mockSend = vi.fn().mockResolvedValue({ status: 200, text: 'OK' });
      (window as unknown as { emailjs: { send: typeof mockSend } }).emailjs = {
        send: mockSend,
      };

      const config = {
        serviceId: 'service_123',
        templateId: 'template_456',
        publicKey: 'public_789',
      };

      await sendEmailWithEmailJS(config, {
        to: 'newuser@example.com',
        subject: 'Test',
        message: 'Test message',
      });

      const history = getEmailHistory();
      expect(history).toContain('newuser@example.com');

      delete (window as unknown as { emailjs?: unknown }).emailjs;
    });
  });

  describe('shareViaWebShare', () => {
    it('should return error when Web Share API not supported', async () => {
      // Remove navigator.share
      const originalShare = navigator.share;
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
      });

      const result = await shareViaWebShare('Title', 'Text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Web Share API not supported');

      // Restore
      Object.defineProperty(navigator, 'share', {
        value: originalShare,
        writable: true,
      });
    });

    it('should call navigator.share with correct data', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        ...navigator,
        share: mockShare,
      });

      await shareViaWebShare('Test Title', 'Test Text');

      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          text: 'Test Text',
        })
      );

      vi.unstubAllGlobals();
    });

    it('should return success on successful share', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        ...navigator,
        share: mockShare,
      });

      const result = await shareViaWebShare('Title', 'Text');

      expect(result.success).toBe(true);
      vi.unstubAllGlobals();
    });

    it('should handle share cancelled (AbortError)', async () => {
      const abortError = new Error('Share cancelled');
      abortError.name = 'AbortError';
      const mockShare = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal('navigator', {
        ...navigator,
        share: mockShare,
      });

      const result = await shareViaWebShare('Title', 'Text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share cancelled');
      vi.unstubAllGlobals();
    });

    it('should handle other share errors', async () => {
      const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
      vi.stubGlobal('navigator', {
        ...navigator,
        share: mockShare,
      });

      const result = await shareViaWebShare('Title', 'Text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share failed');
      vi.unstubAllGlobals();
    });

    it('should include PDF file when canShare supports files', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', {
        ...navigator,
        share: mockShare,
        canShare: mockCanShare,
      });

      const pdfBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      await shareViaWebShare('Test Title', 'Test Text', pdfBlob);

      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([expect.any(File)]),
        })
      );
      vi.unstubAllGlobals();
    });
  });
});
