import {
  isEligibleStudentEmail,
  normalizeStudentEmail,
} from '../src/core/monetization/studentEmail';

describe('studentEmail', () => {
  it('accepts common school domains', () => {
    expect(isEligibleStudentEmail('ada@mit.edu')).toBe(true);
    expect(isEligibleStudentEmail('student@iitb.ac.in')).toBe(true);
    expect(isEligibleStudentEmail('me@college.edu.in')).toBe(true);
    expect(isEligibleStudentEmail('a@ox.ac.uk')).toBe(true);
  });

  it('rejects personal emails', () => {
    expect(isEligibleStudentEmail('me@gmail.com')).toBe(false);
    expect(isEligibleStudentEmail('not-an-email')).toBe(false);
    expect(isEligibleStudentEmail('')).toBe(false);
  });

  it('normalizes email casing and whitespace', () => {
    expect(normalizeStudentEmail('  Ada@MIT.EDU ')).toBe('ada@mit.edu');
  });
});
