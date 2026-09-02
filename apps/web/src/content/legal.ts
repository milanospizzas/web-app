/**
 * Code-level legal publication gate. Environment flags cannot publish data
 * collection until the draft page has actually been replaced with approved copy.
 */
export const legalContentStatus = {
  privacyCopyPresentAndApproved: false,
  termsCopyPresentAndApproved: false,
} as const;
