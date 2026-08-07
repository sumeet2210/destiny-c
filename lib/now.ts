/**
 * Current time for render-time comparisons. Server components render once per
 * request, so reading the clock is safe there — this indirection exists
 * because react-hooks/purity can't know that. Client components should
 * capture it in state instead.
 */
export const nowMs = () => Date.now();
