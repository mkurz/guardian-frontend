/**
 * DO NOT EDIT THIS FILE
 *
 * It is not used to to build anything.
 *
 * It's just a record of the old flow types.
 *
 * Use it as a guide when converting
 * - static/src/javascripts/__flow__/types/membership.js
 * to .ts, then delete it.
 */

declare type StripeCard = {
    last4: string,
    type: string,
    stripePublicKeyForUpdate: string
}

//the type of the response returned by https://github.com/guardian/members-data-api/blob/b5b7eeb9eff00fbcdf07dce6e95d1eac58d9b5e0/membership-attribute-service/app/models/AccountDetails.scala#L11-L16
declare type UserDetails = {
    tier: string,
    isPaidTier: boolean,
    regNumber?: string,
    joinDate: string,
    optIn: boolean,
    subscription: {
        start: string,
        end: string,
        trialLength: number,
        nextPaymentDate: string,
        nextPaymentPrice: number,
        paymentMethod: string,
        renewalDate: string,
        cancelledAt: boolean,
        subscriberId: string,
        plan: {
            name: string,
            amount: number,
            interval: string,
            currency: string
        },
        payPalEmail?: string,
        account?: {
            accountName: string,
        },
        card?: StripeCard,
        account?: {
            accountName: string
        },
    },
    alertText?: string
}