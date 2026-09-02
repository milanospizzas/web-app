'use client';

import type { FormEvent } from 'react';
import { trackEvent } from '@/lib/analytics/events';
import { site } from '@/content/site';

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export function CateringQuoteForm() {
  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = `Catering quote request from ${value(formData, 'customerName')}`;
    const body = [
      `Customer name: ${value(formData, 'customerName')}`,
      `Phone: ${value(formData, 'phone')}`,
      `Email: ${value(formData, 'email')}`,
      `Event date: ${value(formData, 'eventDate')}`,
      `Event time: ${value(formData, 'eventTime')}`,
      `Estimated guest count: ${value(formData, 'guestCount')}`,
      `Pickup or delivery preference: ${value(formData, 'fulfillmentPreference')}`,
      '',
      'Requested items:',
      value(formData, 'requestedItems'),
      '',
      'Special instructions:',
      value(formData, 'specialInstructions') || 'None provided',
    ].join('\n');

    trackEvent('catering_lead_submitted', { source: 'catering-form' });
    window.location.assign(
      `mailto:${site.email}?${new URLSearchParams({ subject, body }).toString()}`,
    );
  }

  return (
    <form
      className="catering-form"
      action={`mailto:${site.email}`}
      method="post"
      encType="text/plain"
      onSubmit={submitInquiry}
    >
      <div className="form-heading">
        <p className="eyebrow">Tell us about your event</p>
        <h2>Request a Catering Quote</h2>
        <p>
          Submitting opens your email app with the details below. Milano's confirms availability
          and final pricing directly with you.
        </p>
      </div>

      <div className="form-grid">
        <label>
          <span>Customer name</span>
          <input name="customerName" autoComplete="name" required />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>Event date</span>
          <input name="eventDate" type="date" required />
        </label>
        <label>
          <span>Event time</span>
          <input name="eventTime" type="time" required />
        </label>
        <label>
          <span>Estimated guest count</span>
          <input name="guestCount" type="number" min="1" inputMode="numeric" required />
        </label>
        <label className="full-field">
          <span>Pickup or delivery preference</span>
          <select name="fulfillmentPreference" required defaultValue="">
            <option value="" disabled>Select a preference</option>
            <option value="Pickup">Pickup</option>
            <option value="Delivery">Delivery</option>
          </select>
        </label>
        <label className="full-field">
          <span>Requested items</span>
          <textarea name="requestedItems" rows={4} required />
        </label>
        <label className="full-field">
          <span>Special instructions</span>
          <textarea name="specialInstructions" rows={4} />
        </label>
      </div>

      <label className="consent-field">
        <input name="consent" type="checkbox" required />
        <span>
          I consent to sending these event details to Milano's Pizzas so the restaurant can respond
          to my catering inquiry.
        </span>
      </label>

      <button className="button button-primary button-large" type="submit">
        Request a Catering Quote
      </button>
      <p className="form-fine-print">
        This form does not accept payment. Availability, fulfillment details, and final pricing are
        confirmed directly by Milano's.
      </p>
      <noscript>
        <p className="form-fine-print">
          Submitting without JavaScript opens your email application and sends the entered details
          directly to Milano's Pizzas.
        </p>
      </noscript>
    </form>
  );
}
