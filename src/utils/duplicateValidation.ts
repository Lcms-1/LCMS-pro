/**
 * Duplicate Member Validation Utilities for LCMS PRO
 * Ensures accurate duplicate checking based ONLY on phone number, email, and ID number/NIN.
 * Prevents false positives caused by name, address, branch, or partial phone number matches.
 */

export function normalizePhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';

  // If 13 digits starting with 234 (e.g. 2348031234567) -> 8031234567
  if (digits.length === 13 && digits.startsWith('234')) {
    return digits.slice(3);
  }
  // If 11 digits starting with 0 (e.g. 08031234567) -> 8031234567
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  // If 10 digits (e.g. 8031234567)
  if (digits.length === 10) {
    return digits;
  }
  return digits;
}

export function normalizeEmail(email?: string): string {
  if (!email) return '';
  const trimmed = email.trim().toLowerCase();
  if (
    !trimmed ||
    trimmed === 'n/a' ||
    trimmed === 'na' ||
    trimmed === 'none' ||
    trimmed === 'nil' ||
    trimmed.startsWith('lc2026-') ||
    trimmed.endsWith('@lightwaycoop.ng') ||
    !trimmed.includes('@')
  ) {
    return '';
  }
  return trimmed;
}

export function normalizeIdNumber(idNumber?: string): string {
  if (!idNumber) return '';
  const trimmed = idNumber.trim().toLowerCase();
  if (
    !trimmed ||
    trimmed === 'n/a' ||
    trimmed === 'na' ||
    trimmed === 'none' ||
    trimmed === 'nil' ||
    trimmed === '-' ||
    trimmed === '00000000000' ||
    trimmed === 'not provided' ||
    trimmed.length < 5
  ) {
    return '';
  }
  return trimmed;
}

export interface MemberValidationCandidate {
  id?: string;
  fullName?: string;
  memberNo?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
}

export function findDuplicateMember<T extends MemberValidationCandidate>(
  existingUsers: T[],
  newMember: { phone?: string; email?: string; idNumber?: string; excludeUserId?: string }
): { matchedMember: T; matchedField: string } | null {
  const newPhoneNorm = normalizePhoneNumber(newMember.phone);
  const newEmailNorm = normalizeEmail(newMember.email);
  const newIdNorm = normalizeIdNumber(newMember.idNumber);

  for (const u of existingUsers) {
    if (newMember.excludeUserId && u.id === newMember.excludeUserId) {
      continue;
    }

    // 1. Phone number check: EXACT match on normalized subscriber number
    const uPhoneNorm = normalizePhoneNumber(u.phone);
    const samePhone = Boolean(newPhoneNorm && uPhoneNorm && newPhoneNorm.length >= 7 && newPhoneNorm === uPhoneNorm);

    // 2. Email check: EXACT match on normalized valid email
    const uEmailNorm = normalizeEmail(u.email);
    const sameEmail = Boolean(newEmailNorm && uEmailNorm && newEmailNorm === uEmailNorm);

    // 3. ID number check: EXACT match on normalized ID/NIN
    const uIdNorm = normalizeIdNumber(u.idNumber);
    const sameId = Boolean(newIdNorm && uIdNorm && newIdNorm === uIdNorm);

    if (samePhone || sameEmail || sameId) {
      let matchedField = 'Contact credentials';
      if (samePhone) matchedField = `Phone number (${newMember.phone})`;
      else if (sameEmail) matchedField = `Email address (${newMember.email})`;
      else if (sameId) matchedField = `ID / NIN Number (${newMember.idNumber})`;

      return {
        matchedMember: u,
        matchedField,
      };
    }
  }

  return null;
}
