'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { LoyaltySignupConfig } from '@/content/features';
import { trackLoyaltySignupCompleted } from '@/lib/analytics/events';

function configIsReady(config: LoyaltySignupConfig) {
  return Boolean(
    config.loyaltyEnabled &&
      config.marketingSignupEnabled &&
      config.destination &&
      config.approvedConsentText &&
      config.unsubscribeHandlingConfigured &&
      config.privacyCopyApproved,
  );
}

export function LoyaltySignupForm({ config }: { config: LoyaltySignupConfig }) {
  const [submissionState, setSubmissionState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  if (!configIsReady(config)) return null;

  const destination = config.destination as string;
  const consentText = config.approvedConsentText as string;

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmissionState('submitting');

    try {
      const response = await fetch(destination, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error('Signup destination rejected the request');

      form.reset();
      setSubmissionState('success');
      trackLoyaltySignupCompleted('loyalty');
    } catch {
      setSubmissionState('error');
    }
  }

  return (
    <form
      className="loyalty-signup-form"
      action={destination}
      method="post"
      acceptCharset="UTF-8"
      onSubmit={(event) => {
        void submitSignup(event);
      }}
    >
      <div className="form-heading">
        <p className="eyebrow">Milano's updates</p>
        <h2>Sign Up for Milano's Updates</h2>
        <p>Share your details only if you would like to receive the approved messages described below.</p>
      </div>

      <div className="form-grid">
        <label>
          <span>Name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="full-field">
          <span>Phone (optional)</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>

      <label className="consent-field">
        <input name="consent" type="checkbox" value="accepted" required />
        <span>{consentText}</span>
      </label>

      <button
        className="button button-primary button-large"
        type="submit"
        disabled={submissionState === 'submitting'}
      >
        {submissionState === 'submitting' ? 'Signing Up…' : 'Sign Up'}
      </button>
      <div className="form-response" aria-live="polite">
        {submissionState === 'success' && (
          <p className="form-success">Your signup was received.</p>
        )}
        {submissionState === 'error' && (
          <p className="form-error" role="alert">
            We could not complete your signup. Please try again later.
          </p>
        )}
      </div>
      <p className="form-fine-print">
        See our <Link className="text-link" href="/privacy">Privacy Notice</Link> for more
        information. This form never collects payment information.
      </p>
    </form>
  );
}
