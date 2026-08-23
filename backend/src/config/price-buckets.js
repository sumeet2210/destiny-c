// PRD §5.3, ₹ per head. max = null means open-ended. Port of config/price-buckets.ts.
export const PRICE_BUCKETS = [
  { key: 'under100', label: 'Under ₹100', min: 0, max: 100 },
  { key: '100to200', label: '₹100–200', min: 100, max: 200 },
  { key: '200to400', label: '₹200–400', min: 200, max: 400 },
  { key: '400plus', label: '₹400+', min: 400, max: null },
];
