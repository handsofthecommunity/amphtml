/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  findElements,
  resetAllElements,
  verifyElementsBuilt,
  verifyPromptsHidden,
} from './common';

describes.endtoend(
  'amp-consent',
  {
    testUrl:
      'http://localhost:8000/test/manual/amp-consent/amp-consent-basic-uses.amp.html#amp-geo=mx',
    experiments: ['amp-consent-geo-override'],
    // TODO (micajuineho): Add shadow-demo after #25985 is fixed, and viewer-demo when...
    environments: ['single'],
  },
  env => {
    let controller;
    let requestBank;

    beforeEach(() => {
      controller = env.controller;
      requestBank = env.requestBank;
    });

    it.skip('should respect server side decision and clear on next visit', async () => {
      resetAllElements();
      const currentUrl = await controller.getCurrentUrl();
      const nextGeoUrl = currentUrl.replace('mx', 'ca');

      // Block/unblock elements based off of 'reject' from response
      await findElements(controller);
      await verifyElementsBuilt(controller, {
        'tillResponded': true,
        'accepted': false,
        'autoReject': true,
        'defaultBlock': false,
        'notBlocked': true,
        'twitter': false,
      });
      // TODO (micajuineho) this should change once #26006 is fixed.
      await verifyPromptsHidden(controller, {
        'ui1': false,
        'ui2': true,
        'postPromptUi': true,
      });

      // Navigate away to random page
      await controller.navigateTo('http://localhost:8000/');
      // Refresh to differnt geolocation
      await controller.navigateTo(nextGeoUrl);

      // Verify it listened to new response
      await findElements(controller);
      await verifyElementsBuilt(controller, {
        'tillResponded': true,
        'accepted': true,
        'autoReject': true,
        'defaultBlock': true,
        'notBlocked': true,
        'twitter': true,
      });
      // TODO (micajuineho) this should change once #26006 is fixed.
      await verifyPromptsHidden(controller, {
        'ui1': false,
        'ui2': true,
        'postPromptUi': true,
      });

      // Check the analytics request consentState
      const req = await requestBank.withdraw('tracking');
      await expect(req.url).to.match(/consentState=sufficient/);
    });
  }
);
