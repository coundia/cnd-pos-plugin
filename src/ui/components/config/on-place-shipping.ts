import {ShippingCalculator, ShippingEligibilityChecker,} from '@vendure/core';
import {LanguageCode} from '@vendure/common/lib/generated-types';


export const OnPlaceShippingEligibilityChecker = new ShippingEligibilityChecker({
	code: 'on-place-checker',
	description: [{ languageCode: LanguageCode.en, value: 'Always eligible for pickup' }],
	args: {},
	check: () => true,
});

export const OnPlaceShippingCalculator = new ShippingCalculator({
	code: 'on-place-calculator',
	description: [{ languageCode: LanguageCode.en, value: 'Zero cost shipping for pickup' }],
	args: {},
	calculate: () => ({
		price: 0,
		priceWithTax: 0,
		priceIncludesTax: false,
		taxRate: 0,
		taxInclusive: false,
	}),
});
