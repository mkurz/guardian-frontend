import { adSizes } from '@guardian/commercial-core';
import type { AdSizeString } from '@guardian/commercial-core';
import { once } from 'lodash-es';
import config from '../../../../lib/config';
import mediator from '../../../../lib/mediator';
import reportError from '../../../../lib/report-error';
import { markTime } from '../../../../lib/user-timing';
import { dfpEnv } from './dfp-env';
import { emptyAdvert } from './empty-advert';
import { getAdvertById } from './get-advert-by-id';
import { renderAdvert } from './render-advert';

const recordFirstAdRendered = once(() => {
	markTime('Commercial: First Ad Rendered');
});

const reportEmptyResponse = (adSlotId: string, event: SlotRenderEndedEvent) => {
	// This empty slot could be caused by a targeting problem,
	// let's report these and diagnose the problem in sentry.
	// Keep the sample rate low, otherwise we'll get rate-limited (report-error will also sample down)
	if (Math.random() < 1 / 10_000) {
		const adUnitPath = event.slot.getAdUnitPath();
		const adTargetingKeys = event.slot.getTargetingKeys();
		const adTargetingKValues = adTargetingKeys.includes('k')
			? event.slot.getTargeting('k')
			: [];
		const adKeywords = adTargetingKValues.join(', ');

		reportError(
			new Error('dfp returned an empty ad response'),
			{
				feature: 'commercial',
				adUnit: adUnitPath,
				adSlot: adSlotId,
				adKeywords,
			},
			false,
		);
	}
};

const outstreamSizes = [
	adSizes.outstreamDesktop.toString(),
	adSizes.outstreamMobile.toString(),
	adSizes.outstreamGoogleDesktop.toString(),
];

export const onSlotRender = (event: SlotRenderEndedEvent): void => {
	recordFirstAdRendered();

	const advert = getAdvertById(event.slot.getSlotElementId());
	if (!advert) {
		return;
	}

	const emitRenderEvents = (isRendered: boolean) => {
		advert.stopRendering(isRendered);
		mediator.emit('modules:commercial:dfp:rendered', event);
	};

	advert.stopLoading(true);
	advert.startRendering();
	advert.isEmpty = event.isEmpty;

	if (event.isEmpty) {
		emptyAdvert(advert);
		reportEmptyResponse(advert.id, event);
		emitRenderEvents(false);
	} else {
		/**
		 * if advert.hasPrebidSize is false we use size
		 * from the GAM event when adjusting the slot size.
		 * */
		if (!advert.hasPrebidSize) {
			advert.size = event.size;
		}

		if (event.creativeId !== undefined) {
			dfpEnv.creativeIDs.push(String(event.creativeId));
		}
		// Set refresh field based on the outcome of the slot render.
		const sizeString = advert.size?.toString();
		const isNotFluid = sizeString !== '0,0';
		const isOutstream = outstreamSizes.includes(sizeString as AdSizeString);
		const isNonRefreshableLineItem =
			event.lineItemId &&
			(
				window.guardian.config.page.dfpNonRefreshableLineItemIds ?? []
			).includes(String(event.lineItemId));

		advert.shouldRefresh =
			isNotFluid &&
			!isOutstream &&
			!config.get('page.hasPageSkin') &&
			!isNonRefreshableLineItem;

		void renderAdvert(advert, event).then(emitRenderEvents);
	}
};