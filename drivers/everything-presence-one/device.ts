import dns from 'dns/promises';

import Debug from 'debug';

import { z } from 'zod';
// @ts-expect-error Client is not typed
import { Client, Connection } from '@2colors/esphome-native-api';

import Homey from 'homey';

const debug = Debug('epo');

Debug.enable(Homey.env.DEBUG_LOGGING);

const CONNECT_TIMEOUT = 15000;

enum DRIVER_SETTINGS {
  ESP_32_STATUS_LED = 'esp32_status_led',
  MMWAVE_LED = 'mmwave_led',
  MMWAVE_ON_LATENCY = 'mmwave_on_latency',
  MMWAVE_OFF_LATENCY = 'mmwave_off_latency',
  MMWAVE_SENSITIVITY = 'mmwave_sensitivity',
  MMWAVE_DISTANCE = 'mmwave_distance'
}

const entityStateSchema = z.object({
  key: z.number(),
  state: z.union([z.number(), z.boolean()]),
  missingState: z.boolean().optional()
});

// Example entity state
// {
//   config: {
//     objectId: '_illuminance',
//     key: 920262939,
//     name: ' Illuminance',
//     uniqueId: 'everything-presence-one-7083ccsensor_illuminance',
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
//   name: ' Illuminance',
//   type: 'Sensor',
//   unit: 'lx',
//   state: { key: 920262939, state: 140.69387817382812, missingState: false }
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
}

// Example entity
// {
//   _events: [Object: null prototype] {
//     error: [Function: bound propagateError] AsyncFunction
//   },
//   _eventsCount: 1,
//   _maxListeners: undefined,
//   handleState: [Function: bound handleState],
//   handleMessage: [Function: bound handleMessage],
//   config: {
//     objectId: '_illuminance',
//     key: 920262939,
//     name: ' Illuminance',
//     uniqueId: 'everything-presence-one-7083ccsensor_illuminance',
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
//   type: 'Sensor',
//   name: ' Illuminance',
//   id: 920262939,
//   connection: EsphomeNativeApiConnection {
//     _events: [Object: null prototype] {
//       'message.DisconnectRequest': [Function (anonymous)],
//       'message.DisconnectResponse': [Function (anonymous)],
//       'message.PingRequest': [Function (anonymous)],
//       'message.GetTimeRequest': [Function (anonymous)],
//       authorized: [AsyncFunction (anonymous)],
//       unauthorized: [AsyncFunction (anonymous)],
//       'message.DeviceInfoResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesBinarySensorResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesButtonResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesCameraResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesClimateResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesCoverResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesFanResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesLightResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesLockResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesMediaPlayerResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesNumberResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesSelectResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesSensorResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesSirenResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesSwitchResponse': [AsyncFunction (anonymous)],
//       'message.ListEntitiesTextSensorResponse': [AsyncFunction (anonymous)],
//       'message.SubscribeLogsResponse': [AsyncFunction (anonymous)],
//       'message.BluetoothLEAdvertisementResponse': [AsyncFunction (anonymous)],
//       error: [AsyncFunction (anonymous)],
//       message: [Function: onMessage],
//       'message.ListEntitiesDoneResponse': [Function],
//       'message.BinarySensorStateResponse': [Array],
//       'message.LightStateResponse': [Function: bound handleMessage],
//       'message.SensorStateResponse': [Array]
//     },
//     _eventsCount: 30,
//     _maxListeners: undefined,
//     frameHelper: PlaintextFrameHelper {
//       _events: [Object: null prototype],
//       _eventsCount: 5,
//       _maxListeners: undefined,
//       host: 'everything-presence-one-7083cc.local',
//       port: 6053,
//       buffer: <Buffer >,
//       socket: [Socket],
//       [Symbol(kCapture)]: false
//     },
//     _connected: true,
//     _authorized: true,
//     port: 6053,
//     host: 'everything-presence-one-7083cc.local',
//     clientInfo: 'homey',
//     password: '',
//     encryptionKey: '',
//     reconnect: true,
//     reconnectTimer: null,
//     reconnectInterval: 30000,
//     pingTimer: Timeout {
//       _idleTimeout: 15000,
//       _idlePrev: [TimersList],
//       _idleNext: [TimersList],
//       _idleStart: 2919,
//       _onTimeout: [AsyncFunction (anonymous)],
//       _timerArgs: undefined,
//       _repeat: 15000,
//       _destroyed: false,
//       [Symbol(refed)]: true,
//       [Symbol(kHasPrimitive)]: false,
//       [Symbol(asyncId)]: 47,
//       [Symbol(triggerId)]: 0
//     },
//     pingInterval: 15000,
//     pingAttempts: 3,
//     pingCount: 0,
//     [Symbol(kCapture)]: false
//   },
//   [Symbol(kCapture)]: false
// }

// const isEntity = (value: unknown): value is Entity => {
//   return (
//     typeof value === 'object' &&
//     value !== null &&
//     'name' in value &&
//     typeof value.name === 'string' &&
//     'type' in value &&
//     typeof value.type === 'string' &&
//     'config' in value &&
//     typeof value.config === 'object' &&
//     value.config !== null &&
//     'objectId' in value.config &&
//     typeof value.config.objectId === 'string' &&
//     'deviceClass' in value.config &&
//     typeof value.config.deviceClass === 'string' &&
//     'uniqueId' in value.config &&
//     typeof value.config.uniqueId === 'string'
//   );
// };

/**
 * On Homey Pro (Early 2023) the host property in the discovery result ends with .local, on Homey
 * Pro (Early 2019) it doesn't,
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

class EverythingPresenceOneDevice extends Homey.Device {
  private debugEntity = debug.extend('entity');
  private debugClient = debug.extend('client');
  private debugDiscovery = debug.extend('discovery');
  private client?: Client;
  private entities: Map<string, { data: ParsedEntityData; original: unknown }> = new Map();

  /** OnInit is called when the device is initialized. */
  async onInit() {
    this.log('EverythingPresenceOneDevice has been initialized');
    this.connect().catch((err) => {
      this.error('EverythingPresenceOneDevice failed to connect', err);
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
      clearSession: false,
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
      this.setUnavailable(this.homey.__('error.unavailable')).catch((err) =>
        this.log('Could not set unavailable', err)
      );
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

    this.debugEntity(`state`, {
      config: entity.config,
      name: entity.name,
      type: entity.type,
      unit:
        entity.config.unitOfMeasurement !== undefined ? entity.config.unitOfMeasurement || '' : '',
      state: parsedState
    });

    switch (entity.config.deviceClass) {
      case 'temperature':
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.debugEntity(`Capability: measure_temperature: state event`, parsedState.state);
        this.setCapabilityValue('measure_temperature', parsedState.state).catch((err) =>
          this.debugEntity('Failed to set measure_temperature capability value', err)
        );
        break;
      case 'humidity':
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.debugEntity(`Capability: measure_humidity: state event`, parsedState.state);
        this.setCapabilityValue('measure_humidity', parsedState.state).catch((err) =>
          this.debugEntity('Failed to set measure_humidity capability value', err)
        );
        break;
      case 'illuminance':
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.debugEntity(`Capability: measure_luminance: state event`, parsedState.state);
        this.setCapabilityValue('measure_luminance', parsedState.state).catch((err) =>
          this.debugEntity('Failed to set measure_luminance capability value', err)
        );
        break;
      case 'motion':
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        this.debugEntity(`Capability: alarm_motion.pir: state event`, parsedState.state);
        this.setCapabilityValue('alarm_motion.pir', parsedState.state).catch((err) =>
          this.debugEntity('Failed to set alarm_motion.pir capability value', err)
        );
        break;
      case 'occupancy':
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        if (entity.config.uniqueId.includes('binary_sensor_mmwave')) {
          this.debugEntity(`Capability: alarm_motion.mmwave: state event`, parsedState.state);
          this.setCapabilityValue('alarm_motion.mmwave', parsedState.state).catch((err) =>
            this.debugEntity('Failed to set alarm_motion.mmwave capability value', err)
          );
        } else if (entity.config.uniqueId.includes('binary_sensor_occupancy')) {
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
      case DRIVER_SETTINGS.MMWAVE_SENSITIVITY:
      case DRIVER_SETTINGS.MMWAVE_ON_LATENCY:
      case DRIVER_SETTINGS.MMWAVE_OFF_LATENCY:
      case DRIVER_SETTINGS.MMWAVE_DISTANCE:
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.debugEntity(`Setting: ${entity.config.objectId}: state event`, parsedState.state);
        this.setSettings({
          [entity.config.objectId]: parsedState.state
        });
        break;
      case DRIVER_SETTINGS.MMWAVE_LED:
      case DRIVER_SETTINGS.ESP_32_STATUS_LED:
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        this.debugEntity(`Setting: ${entity.config.objectId}: state event`, parsedState.state);
        this.setSettings({
          [entity.config.objectId]: parsedState.state
        });

        break;
      default:
        this.debugEntity('Unknown setting:', entity.config.objectId);
    }
  }

  /** OnAdded is called when the user adds the device, called just after pairing. */
  async onAdded() {
    this.log('EverythingPresenceOneDevice has been added');
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
    this.log('EverythingPresenceOneDevice settings were changed');
    for (const changedKey of changedKeys) {
      switch (changedKey) {
        case DRIVER_SETTINGS.MMWAVE_SENSITIVITY:
        case DRIVER_SETTINGS.MMWAVE_ON_LATENCY:
        case DRIVER_SETTINGS.MMWAVE_OFF_LATENCY:
        case DRIVER_SETTINGS.MMWAVE_DISTANCE:
        case DRIVER_SETTINGS.MMWAVE_LED:
        case DRIVER_SETTINGS.ESP_32_STATUS_LED:
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
   * synchronise the name to the device.
   *
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('EverythingPresenceOneDevice was renamed to:', name);
  }

  /** OnDeleted is called when the user deleted the device. */
  async onDeleted() {
    this.log('EverythingPresenceOneDevice has been deleted');
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
    if (typeof discoveryResult.address === 'string') {
      this.setSettings({ ip: discoveryResult.address }).catch((err) => {
        this.error('Failed to update IP in settings', err);
      });
    }
  }
}

module.exports = EverythingPresenceOneDevice;
