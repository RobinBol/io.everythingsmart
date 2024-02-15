import 'source-map-support/register';
import Homey from 'homey';
import Debug from 'debug';

Debug.enable(Homey.env.DEBUG_LOGGING);

class EverythingSmartApp extends Homey.App {
  /** OnInit is called when the app is initialized. */
  async onInit() {
    this.log('EverythingSmartApp has been initialized');
  }
}

module.exports = EverythingSmartApp;
