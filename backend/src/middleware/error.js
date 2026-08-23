// Error plumbing shared by every controller.

/** Typed error whose message is safe to send to the client. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wrap an async route/controller so thrown/rejected errors reach errorHandler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

// Express recognises 4-arg signatures as error handlers; `next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : (err.status ?? 500);
  if (status >= 500) console.error('[error]', err);
  res
    .status(status)
    .json({ ok: false, error: err.message ?? 'Server error' });
}
