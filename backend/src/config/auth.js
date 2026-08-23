// Campus email gate for STUDENT login. Toggle via STUDENT_EMAIL_DOMAINS:
//   • list one or more domains → student signup is restricted to them,
//     e.g. ['student.nitw.ac.in'] (campus-only)
//   • leave it EMPTY           → any valid email may sign in as a student
// Keep this in sync with the Next app's config/auth.ts.
// (The Postgres is_nitw_student_email() function is a dormant second layer: it's
// defined but not referenced by any constraint, trigger, or RLS policy, so it
// enforces nothing on its own — flipping this list is all it takes.)
export const STUDENT_EMAIL_DOMAINS = [];

export const isStudentEmail = (email) => {
  const value = String(email).trim().toLowerCase();
  if (!value.includes('@')) return false; // must still look like an email
  if (STUDENT_EMAIL_DOMAINS.length === 0) return true; // open signup
  return STUDENT_EMAIL_DOMAINS.some((d) => value.endsWith(`@${d}`));
};
