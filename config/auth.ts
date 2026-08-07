// PRD §8: exact NITW student email domain. Decide before P4-1.
export const STUDENT_EMAIL_DOMAINS = ['student.nitw.ac.in'] as const; // PLACEHOLDER

export const isStudentEmail = (email: string) =>
  STUDENT_EMAIL_DOMAINS.some((d) => email.toLowerCase().endsWith(`@${d}`));
