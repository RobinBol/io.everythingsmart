import dns from 'dns/promises';

import Debug from 'debug';

import { z } from 'zod';
// @ts-expect-error Client is not typed
import { Client, Connection } from '@2colors/esphome-native-api';

import Homey from 'homey';

const debug = Debug('epl');

const CONNECT_TIMEOUT = 15000;

// epl:entity Register entity: occupancy: {
//   config: {
//     objectId: 'occupancy',
//     key: 1263039176,
//     name: 'Occupancy',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensoroccupancy',
//     icon: '',
//     deviceClass: 'occupancy',
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   id: 1263039176,
//   name: 'Occupancy',
//   type: 'BinarySensor'
// } +0ms
//   epl:entity Register entity: zone_1_occupancy: {
//   config: {
//     objectId: 'zone_1_occupancy',
//     key: 2609283921,
//     name: 'Zone 1 Occupancy',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensorzone_1_occupancy',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   id: 2609283921,
//   name: 'Zone 1 Occupancy',
//   type: 'BinarySensor'
// } +21ms
//   epl:entity Register entity: zone_2_occupancy: {
//   config: {
//     objectId: 'zone_2_occupancy',
//     key: 2533351870,
//     name: 'Zone 2 Occupancy',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensorzone_2_occupancy',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: true,
//     entityCategory: 0
//   },
//   id: 2533351870,
//   name: 'Zone 2 Occupancy',
//   type: 'BinarySensor'
// } +19ms
//   epl:entity Register entity: zone_3_occupancy: {
//   config: {
//     objectId: 'zone_3_occupancy',
//     key: 3748869447,
//     name: 'Zone 3 Occupancy',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensorzone_3_occupancy',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: true,
//     entityCategory: 0
//   },
//   id: 3748869447,
//   name: 'Zone 3 Occupancy',
//   type: 'BinarySensor'
// } +20ms
//   epl:entity Register entity: zone_4_occupancy: {
//   config: {
//     objectId: 'zone_4_occupancy',
//     key: 979325612,
//     name: 'Zone 4 Occupancy',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensorzone_4_occupancy',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: true,
//     entityCategory: 0
//   },
//   id: 979325612,
//   name: 'Zone 4 Occupancy',
//   type: 'BinarySensor'
// } +20ms
//   epl:entity Register entity: target_1_active: {
//   config: {
//     objectId: 'target_1_active',
//     key: 366018787,
//     name: 'Target 1 Active',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensortarget_1_active',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   id: 366018787,
//   name: 'Target 1 Active',
//   type: 'BinarySensor'
// } +19ms
//   epl:entity Register entity: target_2_active: {
//   config: {
//     objectId: 'target_2_active',
//     key: 4280005854,
//     name: 'Target 2 Active',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensortarget_2_active',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   id: 4280005854,
//   name: 'Target 2 Active',
//   type: 'BinarySensor'
// } +25ms
//   epl:entity Register entity: target_3_active: {
//   config: {
//     objectId: 'target_3_active',
//     key: 3413445721,
//     name: 'Target 3 Active',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensortarget_3_active',
//     icon: '',
//     deviceClass: '',
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   id: 3413445721,
//   name: 'Target 3 Active',
//   type: 'BinarySensor'
// } +95ms
//   epl:entity state {
//   config: {
//     objectId: 'occupancy',
//     key: 1263039176,
//     name: 'Occupancy',
//     uniqueId: 'everything-presence-lite-22354cbinary_sensoroccupancy',
//     icon: '',
//     deviceClass: 'occupancy',
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   name: 'Occupancy',
//   type: 'BinarySensor',
//   unit: '',
//   state: { key: 1263039176, state: true, missingState: false }
// } +1ms

enum DRIVER_SETTINGS {
  ESP_32_LED = 'esp32_led'
}

const entityStateSchema = z.object({
  key: z.number(),
  state: z.union([z.number(), z.boolean()]),
  missingState: z.boolean().optional()
});

// Example entity state
// {
//   config: {
//     objectId: 'illuminance',
//     key: 1797020032,
//     name: 'Illuminance',
//     uniqueId: 'everything-presence-lite-22354csensorilluminance',
//     icon: '',
//     unitOfMeasurement: 'lx',
//     accuracyDecimals: 1,
//     forceUpdate: false,
//     deviceClass: 'illuminance',
//     stateClass: 1,
//     lastResetType: 0,
//     disabledByDefault: false,
//     entityCategory: 0
//   },
//   name: 'Illuminance',
//   type: 'Sensor',
//   unit: 'lx',
//   state: { key: 1797020032, state: 10.979330062866211, missingState: false }
// }

const entitySchema = z.object({
  config: z.object({
    objectId: z.string(),
    key: z.number(),
    name: z.string(),
    uniqueId: z.string(),
    icon: z.string(),
    unitOfMeasurement: z.string().optional(),
    accuracyDecimals: z.number().optional(),
    forceUpdate: z.boolean().optional(),
    deviceClass: z.string().optional(),
    stateClass: z.number().optional(),
    lastResetType: z.number().optional(),
    disabledByDefault: z.boolean(),
    entityCategory: z.number()
  }),
  id: z.number(),
  name: z.string(),
  type: z.string(),
  unit: z.string().optional()
});

type ParsedEntityData = z.infer<typeof entitySchema>;

interface DiscoveryResult {
  id: string;
  lastSeen: Date;
  address?: string;
  port?: number;
  host?: string;
  txt?: {
    version?: string;
    project_version?: string;
  };
}

/**
 * On Homey Pro (Early 2023) the host property in the discovery result ends with .local, on Homey
 * Pro (Early 2019) it doesn't.
 *
 * @param host
 * @returns
 */
function formatHostname(host: string) {
  if (host.endsWith('.local')) return host;
  return `${host}.local`;
}

/**
 * Get typed error message from unknown parameter.
 *
 * @param error
 * @returns
 */
function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Check if entity has uniqueId that matches the binary sensor occupancy. Note: it appears that
 * between 2023.4.2 (1.1.3) and 2023.7.1 (1.1.6) of the EP1 firmware a breaking change was
 * introduced, the uniqueId binary_sensor_occupancy was changed to binary_sensoroccupancy. GitHub
 * issue: https://github.com/EverythingSmartHome/everything-presence-one/issues/99
 *
 * @param entity
 * @returns
 */
function includesBinarySensorOccupancy(entity: ParsedEntityData) {
  return entity.config.uniqueId.includes('binary_sensoroccupancy');
}

class EverythingPresenceLiteDevice extends Homey.Device {
  private debugEntity = debug.extend('entity');
  private debugClient = debug.extend('client');
  private debugDiscovery = debug.extend('discovery');
  private client?: Client;
  private entities: Map<string, { data: ParsedEntityData; original: unknown }> = new Map();

  /** OnInit is called when the device is initialized. */
  async onInit() {
    this.log('EverythingPresenceLiteDevice has been initialized');
    this.connect().catch((err) => {
      this.error('EverythingPresenceLiteDevice failed to connect', err);
    });
  }

  /**
   * Create Client instance and connect to device.
   *
   * @returns
   */
  async connect(): Promise<Client> {
    const addressProps = {
      host: formatHostname(this.getStoreValue('host')),
      port: this.getStoreValue('port')
    };
    this.debugClient('connecting:', addressProps);
    this.client = new Client({
      ...addressProps,
      clearSession: true,
      initializeDeviceInfo: false,
      initializeListEntities: false,
      initializeSubscribeStates: true,
      initializeSubscribeLogs: false,
      initializeSubscribeBLEAdvertisements: false,
      clientInfo: 'homey',
      encryptionKey: '',
      password: '', // Deprecated
      reconnect: true,
      reconnectInterval: 30000,
      pingInterval: 15000,
      pingAttempts: 3
    });

    // Listen for entities
    this.client.on('newEntity', (entity: unknown) => this.registerEntity(entity));

    // Listen for client errors
    this.client.on('error', (error: unknown) => {
      this.debugClient('error:', error);
      if (getErrorMessage(error).includes('Bad format: Encryption expected')) {
        this.setUnavailable(this.homey.__('error.unavailable_encrypted')).catch((err) =>
          this.log('Could not set unavailable', err)
        );
        return;
      }
      this.disconnect();
      this.connect().catch((connectError) => {
        this.log('Could not re-connect after error', connectError);
        this.setUnavailable(this.homey.__('error.unavailable')).catch((err) =>
          this.log('Could not set unavailable', err)
        );
      });
    });

    return new Promise((resolve, reject) => {
      const connectTimeout = this.homey.setTimeout(
        () => reject(new Error(this.homey.__('error.connect_timeout'))),
        CONNECT_TIMEOUT
      );
      this.client.connect();
      this.client.on('initialized', () => {
        this.debugClient('connected', addressProps);
        this.homey.clearTimeout(connectTimeout);

        // Fetch all entities
        this.client.connection.listEntitiesService().catch((err: unknown) => {
          this.error('Failed to list entities service:', err);
        });

        // Resolve hostname to ip address
        dns
          .lookup(addressProps.host)
          .then((result) => {
            this.debugClient('resolved hostname to:', result);
            return this.setSettings({ ip: result.address });
          })
          .catch((err) => this.debugClient('failed to update ip address in settings', err));

        // Mark device as available in case it was unavailable
        this.setAvailable().catch((err) => this.log('Could not set available', err));

        return resolve(this.client);
      });
    });
  }

  disconnect() {
    this.debugClient('disconnect');
    this.client?.disconnect();
    this.client?.removeAllListeners();
    this.entities.forEach((entity) => {
      // Validate entity.original.removeAllListeners
      if (
        typeof entity.original !== 'object' ||
        entity.original === null ||
        !('removeAllListeners' in entity.original) ||
        typeof entity.original.removeAllListeners !== 'function'
      ) {
        throw new Error('Expected entity.removeAllListeners to be a function');
      }
      entity.original.removeAllListeners();
    });
  }

  /**
   * Register an entity, bind state listener and subscribe to state events.
   *
   * @param entity
   */
  registerEntity(entity: unknown) {
    // Parse entity data
    const parseEntityResult = entitySchema.safeParse(entity);
    if (!parseEntityResult.success) {
      this.debugEntity('Invalid entity object received, error:', parseEntityResult.error, entity);
      return;
    }

    // Cache entity
    this.entities.set(parseEntityResult.data.config.objectId, {
      data: parseEntityResult.data,
      original: entity
    });
    this.debugEntity(
      `Register entity: ${parseEntityResult.data.config.objectId}:`,
      parseEntityResult.data
    );

    // Validate entity.connection
    if (
      typeof entity !== 'object' ||
      entity === null ||
      !('connection' in entity) ||
      !(entity.connection instanceof Connection)
    ) {
      throw new Error('Expected entity.connection to be instanceof Connection');
    }

    // @ts-expect-error subscribeStatesService exists but is not typed
    entity.connection.subscribeStatesService();

    // Validate entity.on
    if (
      typeof entity !== 'object' ||
      entity === null ||
      !('on' in entity) ||
      typeof entity.on !== 'function'
    ) {
      throw new Error('Expected entity.on to be a function');
    }

    // Subscribe to entity events
    entity.on(`state`, (state: unknown) =>
      this.onEntityState(parseEntityResult.data.config.objectId, state)
    );
  }

  /**
   * Called when a state event is received for a specific entity.
   *
   * @param entity
   * @param state
   */
  onEntityState(entityId: string, state: unknown) {
    const parseResult = entityStateSchema.safeParse(state);
    if (!parseResult.success) {
      this.debugEntity(
        `Got invalid entity state for entityId ${entityId}, error:`,
        parseResult.error,
        state
      );
      return;
    }

    const parsedState = parseResult.data;

    // Get entity
    const entity = this.entities.get(entityId)?.data;
    if (!entity) throw new Error(`Missing entity ${entityId}`);
    if (entity.config.deviceClass === 'speed' || entity.config.deviceClass === 'distance') {
      return;
    }
    this.debugEntity(`state`, {
      config: entity.config,
      name: entity.name,
      type: entity.type,
      unit:
        entity.config.unitOfMeasurement !== undefined ? entity.config.unitOfMeasurement || '' : '',
      state: parsedState
    });

    switch (entity.config.deviceClass) {
      case 'illuminance':
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.debugEntity(`Capability: measure_luminance: state event`, parsedState.state);
        this.setCapabilityValue('measure_luminance', parsedState.state).catch((err) =>
          this.debugEntity('Failed to set measure_luminance capability value', err)
        );
        break;
      case 'occupancy':
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        if (includesBinarySensorOccupancy(entity)) {
          this.debugEntity(`Capability: alarm_motion: state event`, parsedState.state);
          this.setCapabilityValue('alarm_motion', parsedState.state).catch((err) =>
            this.debugEntity('Failed to set alarm_motion capability value', err)
          );
        }
        break;
      default:
        this.debugEntity('Unknown device class:', entity.config.deviceClass);
    }

    // Read and update settings
    switch (entity.config.objectId) {
      case DRIVER_SETTINGS.ESP_32_LED:
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        this.debugEntity(`Setting: ${entity.config.objectId}: state event`, parsedState.state);
        this.setSettings({
          [entity.config.objectId]: parsedState.state
        }).catch((err) =>
          this.debugEntity(
            `Failed to set setting ${entity.config.objectId} to value: ${parsedState.state}, reason:`,
            err
          )
        );

        break;
      default:
        this.debugEntity('Unknown setting:', entity.config.objectId);
    }
  }

  /** OnAdded is called when the user adds the device, called just after pairing. */
  async onAdded() {
    this.log('EverythingPresenceLiteDevice has been added');
  }

  /**
   * OnSettings is called when the user updates the device's settings.
   *
   * @param {object} event The onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string | void>} Return a custom message that will be displayed
   */
  async onSettings({
    newSettings,
    changedKeys
  }: {
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('EverythingPresenceLiteDevice settings were changed');
    for (const changedKey of changedKeys) {
      switch (changedKey) {
        case DRIVER_SETTINGS.ESP_32_LED:
          const entity = this.entities.get(changedKey);
          if (!entity) throw new Error(`Missing entity ${changedKey}`);
          if (!entity.original) throw new Error(`Missing original entity ${changedKey}`);
          const value = newSettings[changedKey];
          if (typeof value === 'number' || typeof value === 'boolean') {
            // Validate entity.original.setState
            if (
              typeof entity.original !== 'object' ||
              entity.original === null ||
              !('setState' in entity.original) ||
              typeof entity.original.setState !== 'function'
            ) {
              throw new Error('Expected entity.setState to be a function');
            }
            entity.original.setState(value);
          }
          break;
        default:
          this.log('Unknown changed setting key:', changedKey);
      }
    }
  }

  /**
   * OnRenamed is called when the user updates the device's name. This method can be used this to
   * synchronize the name to the device.
   *
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('EverythingPresenceLiteDevice was renamed to:', name);
  }

  /** OnDeleted is called when the user deleted the device. */
  async onDeleted() {
    this.log('EverythingPresenceLiteDevice has been deleted');
    this.disconnect();
  }

  /**
   * Return a truthy value here if the discovery result matches your device.
   *
   * @param discoveryResult
   * @returns
   */
  onDiscoveryResult(discoveryResult: DiscoveryResult) {
    this.debugDiscovery(`result match: ${discoveryResult.id === this.getData().id}`);
    return discoveryResult.id === this.getData().id;
  }

  /**
   * This method will be executed once when the device has been found (onDiscoveryResult returned
   * true).
   *
   * @param discoveryResult
   */
  async onDiscoveryAvailable(discoveryResult: DiscoveryResult) {
    this.debugDiscovery('available', discoveryResult);
    const settings = this.getSettings();
    if (typeof discoveryResult.address === 'string' && settings.ip !== discoveryResult.address) {
      settings.ip = discoveryResult.address;
    }
    if (
      typeof discoveryResult.txt?.version === 'string' &&
      settings.esp_home_version !== discoveryResult.txt.version
    ) {
      settings.esp_home_version = discoveryResult.txt.version;
    }
    if (
      typeof discoveryResult.txt?.project_version === 'string' &&
      settings.project_version !== discoveryResult.txt.project_version
    ) {
      settings.project_version = discoveryResult.txt.project_version;
    }

    // Update settings if needed
    if (Object.keys(settings).length > 0) {
      this.setSettings(settings).catch((err) => {
        this.error('Failed to update IP in settings', err);
      });
    }
  }
}

module.exports = EverythingPresenceLiteDevice;
