/**
 * DO NOT EDIT THIS FILE
 *
 * It is not used to to build anything.
 *
 * It's just a record of the old flow types.
 *
 * Use it as a guide when converting
 * - static/src/javascripts/projects/common/modules/tracking/google-analytics.js
 * to .ts, then delete it.
 */

// @flow

import mediator from 'lib/mediator';
import {onConsentChange, getConsentFor} from '@guardian/consent-management-platform';

export const init: () => void = () => {
  onConsentChange(state => {
      const gaHasConsent = getConsentFor('google-analytics', state);
      mediator.emit('ga:gaConsentChange', gaHasConsent);
  })
};