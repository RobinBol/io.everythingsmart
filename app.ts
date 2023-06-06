import 'source-map-support/register';

import Homey from 'homey';

class EverythingSmartApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('EverythingSmartApp has been initialized');
  }
}

module.exports = EverythingSmartApp;
