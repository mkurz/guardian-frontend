import { adSizes } from '@guardian/commercial-core';
import { isInVariantSynchronous } from 'common/modules/experiments/ab';
import { spacefinderOkr1FilterNearby } from 'common/modules/experiments/tests/spacefinder-okr-1-filter-nearby';
import { spacefinderOkr3RichLinks } from 'common/modules/experiments/tests/spacefinder-okr-3-rich-links';
import { getBreakpoint, getViewport } from 'lib/detect-viewport';
import { getUrlVars } from 'lib/url';
import config from '../../../lib/config';
import fastdom from '../../../lib/fastdom-promise';
import { mediator } from '../../../lib/mediator';
import { spaceFiller } from '../../common/modules/article/space-filler';
import type {
	SpacefinderRules,
	SpacefinderWriter,
} from '../../common/modules/article/space-filler';
import { commercialFeatures } from '../../common/modules/commercial/commercial-features';
import type { SizeMappings } from '../modules/dfp/create-slot';
import { initCarrot } from './carrot-traffic-driver';
import { addSlot } from './dfp/add-slot';
import { createAdSlot } from './dfp/create-slot';
import { trackAdRender } from './dfp/track-ad-render';
import { filterNearbyCandidatesBroken } from './filter-nearby-candidates-broken';
import { filterNearbyCandidatesFixed } from './filter-nearby-candidates-fixed';

const sfdebug = getUrlVars().sfdebug;

const isPaidContent = config.get<boolean>('page.isPaidContent', false);

const adSlotClassSelectorSizes = {
	minAbove: 500,
	minBelow: 500,
};

const insertAdAtPara = (
	para: Node,
	name: string,
	type: string,
	classes?: string,
	sizes?: SizeMappings,
): Promise<void> => {
	const ad = createAdSlot(type, {
		name,
		classes,
		sizes,
	});

	return fastdom
		.mutate(() => {
			if (para.parentNode) {
				para.parentNode.insertBefore(ad, para);
			}
		})
		.then(() => {
			const shouldForceDisplay = ['im', 'carrot'].includes(name);
			addSlot(ad, shouldForceDisplay);
		});
};

const filterNearbyCandidates = isInVariantSynchronous(
	spacefinderOkr1FilterNearby,
	'variant',
)
	? filterNearbyCandidatesFixed
	: filterNearbyCandidatesBroken;

const isDotcomRendering = config.get<boolean>('isDotcomRendering', false);
const articleBodySelector = isDotcomRendering
	? '.article-body-commercial-selector'
	: '.js-article__body';

const addDesktopInlineAds = (isInline1: boolean): Promise<boolean> => {
	const ignoreList = isInVariantSynchronous(
		spacefinderOkr3RichLinks,
		'variant',
	)
		? ' > :not(p):not(h2):not(.ad-slot):not(#sign-in-gate):not([data-spacefinder-component="rich-link"])'
		: ' > :not(p):not(h2):not(.ad-slot):not(#sign-in-gate)';

	const isImmersive = config.get('page.isImmersive');
	const defaultRules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p',
		minAbove: isImmersive ? 700 : 300,
		minBelow: isDotcomRendering ? 300 : 700,
		selectors: {
			' > h2': {
				minAbove: 5,
				minBelow: 190,
			},
			' .ad-slot': adSlotClassSelectorSizes,
			[ignoreList]: {
				minAbove: 35,
				minBelow: 400,
			},
			' figure.element-immersive': {
				minAbove: 0,
				minBelow: 600,
			},
			' figure.element--supporting': {
				minAbove: 500,
				minBelow: 0,
			},
		},
		filter: filterNearbyCandidates(adSizes.mpu.height),
	};

	// For any other inline
	const relaxedRules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p',
		minAbove: isPaidContent ? 1600 : 1000,
		minBelow: isDotcomRendering ? 300 : 800,
		selectors: {
			' .ad-slot': adSlotClassSelectorSizes,
			' figure.element-immersive': {
				minAbove: 0,
				minBelow: 600,
			},
			' [data-spacefinder-component="numbered-list-title"]': {
				minAbove: 25,
				minBelow: 0,
			},
		},
		filter: filterNearbyCandidates(adSizes.halfPage.height),
	};

	const rules = isInline1 ? defaultRules : relaxedRules;

	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras
			.slice(0, isInline1 ? 1 : paras.length)
			.map((para, i) => {
				const inlineId = i + (isInline1 ? 1 : 2);

				if (sfdebug) {
					para.style.cssText += 'border: thick solid green;';
				}

				return insertAdAtPara(
					para,
					`inline${inlineId}`,
					'inline',
					`inline${isInline1 ? '' : ' offset-right'}`,
					isInline1
						? undefined
						: { desktop: [adSizes.halfPage, adSizes.skyscraper] },
				);
			});
		await Promise.all(slots);
	};

	const enableDebug =
		(sfdebug === '1' && isInline1) || (sfdebug === '2' && !isInline1);

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForLinks: true,
		waitForInteractives: true,
		debug: enableDebug,
	});
};

const addMobileInlineAds = (): Promise<boolean> => {
	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p',
		minAbove: 200,
		minBelow: 200,
		selectors: {
			' > h2': {
				minAbove: 100,
				minBelow: 250,
			},
			' .ad-slot': adSlotClassSelectorSizes,
			' > :not(p):not(h2):not(.ad-slot):not(#sign-in-gate)': {
				minAbove: 35,
				minBelow: 200,
			},
			// fromBottom looks like it was mistakenly put in the selectors object where it's ignored by spacefinder
			// and belongs at the root level of SpacefinderRules.
			// TODO Investigate the impact of correcting the typo - should mobile inline slots be filled fromBottom?
			// fromBottom: true,
		},
		filter: filterNearbyCandidates(adSizes.mpu.height),
	};

	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras.map((para, i) =>
			insertAdAtPara(
				para,
				i === 0 ? 'top-above-nav' : `inline${i}`,
				i === 0 ? 'top-above-nav' : 'inline',
				'inline',
			),
		);
		await Promise.all(slots);
	};

	const enableDebug = sfdebug === '1';

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForLinks: true,
		waitForInteractives: true,
		debug: enableDebug,
	});
};

const addInlineAds = (): Promise<boolean> => {
	const isMobile = getBreakpoint(getViewport().width) === 'mobile';

	if (isMobile) {
		return addMobileInlineAds();
	}
	if (isPaidContent) {
		return addDesktopInlineAds(false);
	}
	return addDesktopInlineAds(true).then(() => addDesktopInlineAds(false));
};

const attemptToAddInlineMerchAd = (): Promise<boolean> => {
	const breakpoint = getBreakpoint(getViewport().width);
	const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';

	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p',
		minAbove: 300,
		minBelow: 0,
		selectors: {
			' > .merch': {
				minAbove: 0,
				minBelow: 0,
			},
			' > header': {
				minAbove: isMobileOrTablet ? 300 : 700,
				minBelow: 0,
			},
			' > h2': {
				minAbove: 100,
				minBelow: 250,
			},
			' .ad-slot': adSlotClassSelectorSizes,
			' > :not(p):not(h2):not(.ad-slot):not(#sign-in-gate)': {
				minAbove: 200,
				minBelow: 400,
			},
		},
	};

	const insertAds: SpacefinderWriter = (paras) =>
		insertAdAtPara(paras[0], 'im', 'im');

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForLinks: true,
		waitForInteractives: true,
	});
};

const doInit = async (): Promise<boolean> => {
	if (!commercialFeatures.articleBodyAdverts) {
		return Promise.resolve(false);
	}

	const im = config.get('page.hasInlineMerchandise')
		? attemptToAddInlineMerchAd()
		: Promise.resolve(false);
	const inlineMerchAdded = await im;
	if (inlineMerchAdded) await trackAdRender('dfp-ad--im');
	await addInlineAds();
	await initCarrot();

	return im;
};

/**
 * Initialise article body ad slots
 */
export const init = (): Promise<boolean> => {
	// Also init when the main article is redisplayed
	// For instance by the signin gate.
	mediator.on('page:article:redisplayed', doInit);
	// DCR doesn't have mediator, so listen for CustomEvent
	document.addEventListener('dcr:page:article:redisplayed', () => {
		void doInit();
	});
	return doInit();
};