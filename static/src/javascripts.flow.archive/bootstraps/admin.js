/**
 * DO NOT EDIT THIS FILE
 *
 * It is not used to to build anything.
 *
 * It's just a record of the old flow types.
 *
 * Use it as a guide when converting
 * - static/src/javascripts/bootstraps/admin.js
 * to .ts, then delete it.
 */

// @flow
import { init as initDrama } from 'admin/bootstraps/drama';
import { initABTests } from 'admin/bootstraps/abtests';
import { initRadiator } from 'admin/bootstraps/radiator';
import domReady from 'domready';

domReady(() => {
    switch (window.location.pathname) {
        case '/analytics/abtests':
            initABTests();
            break;

        case '/dev/switchboard':
            initDrama();
            break;

        case '/radiator':
            initRadiator();
            break;

        default: // do nothing
    }
});