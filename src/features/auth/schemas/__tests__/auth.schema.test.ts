import { emailSchema, phoneSchema, otpSchema } from '../auth.schema';

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    const result = emailSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = emailSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string', () => {
    const result = emailSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('returns the schema error message on invalid email', () => {
    const result = emailSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please enter a valid email address'
      );
    }
  });
});

describe('phoneSchema', () => {
  it('strips non-digit characters', () => {
    const result = phoneSchema.safeParse({ phone: '(555) 123-4567' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('5551234567');
    }
  });

  it('passes a plain digit string unchanged', () => {
    const result = phoneSchema.safeParse({ phone: '5551234567' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('5551234567');
    }
  });

  it('returns an empty string when all characters are non-digits', () => {
    const result = phoneSchema.safeParse({ phone: '---' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('');
    }
  });
});

describe('otpSchema', () => {
  it('accepts a 6-character string', () => {
    const result = otpSchema.safeParse({ code: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects a code shorter than 6 characters', () => {
    const result = otpSchema.safeParse({ code: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects a code longer than 6 characters', () => {
    const result = otpSchema.safeParse({ code: '1234567' });
    expect(result.success).toBe(false);
  });

  it('returns the correct error message', () => {
    const result = otpSchema.safeParse({ code: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Enter the 6-digit code');
    }
  });
});
