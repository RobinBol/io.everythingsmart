import { z } from 'zod';

import Homey from 'homey';

import { formatMacString } from './../../lib/util';

const discoveryResultSchema = z.object({
  txt: z.object({
    mac: z.string(),
    version: z.string(),
    project_version: z.string()
  }),
  host: z.string(),
  address: z.string(),
  port: z.number(),
  name: z.string()
});

class EverythingPresenceOneDriver extends Homey.Driver {
  /** OnInit is called when the driver is initialized. */
  async onInit() {
    this.log('EverythingPresenceOneDriver has been initialized');
  }

  /**
   * OnPairListDevices is called when a user is adding a device and the 'list_devices' view is
   * called. This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    const devices = Object.values(discoveryResults).map((discoveryResult: unknown) => {
      // Parse the discovery result with zod
      const parseResult = discoveryResultSchema.safeParse(discoveryResult);
      if (!parseResult.success) {
        this.error('Got invalid discovery result, error:', parseResult.error);
        return null;
      }

      return {
        name: `Everything Presence One (${formatMacString(parseResult.data.txt.mac)})`,
        data: {
          id: parseResult.data.txt.mac
        },
        store: {
          host: parseResult.data.host,
          port: parseResult.data.port
        },
        settings: {
          mac: formatMacString(parseResult.data.txt.mac),
          ip: parseResult.data.address,
          host: parseResult.data.host,
          port: String(parseResult.data.port),
          esp_home_version: parseResult.data.txt.version,
          project_version: parseResult.data.txt.project_version
        }
      };
    });

    // Filter out null entries (TS doesn't understand this)
    return devices.filter((device) => Boolean(device));
  }
}

// Example discovery result:
// id: 'd4d4da708528',
// lastSeen: '2023-05-05T19:54:59.414Z',
// address: '192.168.178.148',
// host: 'everything-presence-one-708528',
// port: 6053,
// name: 'everything-presence-one-708528',
// fullname: 'everything-presence-one-708528._esphomelib._tcp.local.',
// txt: {
//   version: '2023.4.2',
//   mac: 'd4d4da708528',
//   platform: 'ESP32',
//   board: 'esp32dev',
//   network: 'wifi',
//   project_name: 'Everything_Smart_Technology.Everything_Presence_One',
//   project_version: '1.1.3',
//   package_import_url: 'github://everythingsmarthome/presence-one/everything-presence-one.yaml@main'
// },

module.exports = EverythingPresenceOneDriver;
