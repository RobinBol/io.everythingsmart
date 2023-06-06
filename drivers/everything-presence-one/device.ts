import { z } from 'zod';
// @ts-expect-error Client is not typed
import { Client, Connection } from '@2colors/esphome-native-api';

import Homey from 'homey';

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

class EverythingPresenceOneDevice extends Homey.Device {
  private client?: Client;
  private entities: Map<string, { data: ParsedEntityData; original: unknown }> = new Map();

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('EverythingPresenceOneDevice has been initialized');

    // Connect to device
    this.client = await this.connect();
  }

  /**
   * Create Client instance and connect to device.
   * @returns
   */
  async connect(): Promise<Client> {
    const client = new Client({
      clearSession: false,
      initializeDeviceInfo: false,
      initializeListEntities: false,
      initializeSubscribeStates: true,
      initializeSubscribeLogs: false,
      initializeSubscribeBLEAdvertisements: false,
      host: `${this.getStoreValue('host')}`,
      port: this.getStoreValue('port'),
      clientInfo: 'homey',
      encryptionKey: '',
      password: '', // Deprecated
      reconnect: true,
      reconnectInterval: 30000,
      pingInterval: 15000,
      pingAttempts: 3
    });

    // Listen for entities
    client.on('newEntity', (entity: unknown) => this.registerEntity(entity));

    // Listen for client errors
    client.on('error', (error: unknown) => {
      this.log('Client error:', error);
      this.setUnavailable(this.homey.__('error.unavailable')).catch((err) =>
        this.error('Could not set unavailable', err)
      );
    });

    return new Promise((resolve, reject) => {
      const connectTimeout = this.homey.setTimeout(
        () => reject(new Error(this.homey.__('error.connect_timeout'))),
        CONNECT_TIMEOUT
      );
      client.connect();
      client.on('initialized', () => {
        this.log('Client initialized');
        this.homey.clearTimeout(connectTimeout);

        // Fetch all entities
        client.connection.listEntitiesService();

        return resolve(client);
      });
    });
  }

  /**
   * Register an entity, bind state listener and subscribe to state events.
   * @param entity
   */
  registerEntity(entity: unknown) {
    // Parse entity data
    const parseEntityResult = entitySchema.safeParse(entity);
    if (!parseEntityResult.success) {
      this.error('Invalid entity object received, error:', parseEntityResult.error, entity);
      return;
    }

    // Cache entity
    this.entities.set(parseEntityResult.data.config.objectId, {
      data: parseEntityResult.data,
      original: entity
    });
    this.log(`Register entity: ${parseEntityResult.data.config.objectId}:`, parseEntityResult.data);

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
   * @param entity
   * @param state
   */
  onEntityState(entityId: string, state: unknown) {
    if (this.getAvailable() === false) {
      this.setAvailable().catch((err) => this.error('Could not set available', err));
    }

    const parseResult = entityStateSchema.safeParse(state);
    if (!parseResult.success) {
      this.error(
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

    this.log(`state`, {
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
        this.log(`Capability: measure_temperature: state event`, parsedState.state);
        this.setCapabilityValue('measure_temperature', parsedState.state).catch((err) =>
          this.error('Failed to set measure_temperature capability value', err)
        );
        break;
      case 'humidity':
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.log(`Capability: measure_humidity: state event`, parsedState.state);
        this.setCapabilityValue('measure_humidity', parsedState.state).catch((err) =>
          this.error('Failed to set measure_humidity capability value', err)
        );
        break;
      case 'illuminance':
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.log(`Capability: measure_luminance: state event`, parsedState.state);
        this.setCapabilityValue('measure_luminance', parsedState.state).catch((err) =>
          this.error('Failed to set measure_luminance capability value', err)
        );
        break;
      case 'motion':
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        this.log(`Capability: alarm_motion.pir: state event`, parsedState.state);
        this.setCapabilityValue('alarm_motion.pir', parsedState.state).catch((err) =>
          this.error('Failed to set alarm_motion.pir capability value', err)
        );
        break;
      case 'occupancy':
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        if (entity.config.uniqueId.includes('binary_sensor_mmwave')) {
          this.log(`Capability: alarm_motion.mmwave: state event`, parsedState.state);
          this.setCapabilityValue('alarm_motion.mmwave', parsedState.state).catch((err) =>
            this.error('Failed to set alarm_motion.mmwave capability value', err)
          );
        } else if (entity.config.uniqueId.includes('binary_sensor_occupancy')) {
          this.log(`Capability: alarm_motion: state event`, parsedState.state);
          this.setCapabilityValue('alarm_motion', parsedState.state).catch((err) =>
            this.error('Failed to set alarm_motion capability value', err)
          );
        }
        break;
      default:
        this.error('Unknown device class:', entity.config.deviceClass);
    }

    // Read and update settings
    switch (entity.config.objectId) {
      case DRIVER_SETTINGS.MMWAVE_SENSITIVITY:
      case DRIVER_SETTINGS.MMWAVE_ON_LATENCY:
      case DRIVER_SETTINGS.MMWAVE_OFF_LATENCY:
      case DRIVER_SETTINGS.MMWAVE_DISTANCE:
        // Throw when state is not a number
        z.number().parse(parsedState.state);
        this.log(`Setting: ${entity.config.objectId}: state event`, parsedState.state);
        this.setSettings({
          [entity.config.objectId]: parsedState.state
        });
        break;
      case DRIVER_SETTINGS.MMWAVE_LED:
      case DRIVER_SETTINGS.ESP_32_STATUS_LED:
        // Throw when state is not a boolean
        z.boolean().parse(parsedState.state);
        this.log(`Setting: ${entity.config.objectId}: state event`, parsedState.state);
        this.setSettings({
          [entity.config.objectId]: parsedState.state
        });

        break;
      default:
        this.log('Unknown setting:', entity.config.objectId);
    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('EverythingPresenceOneDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
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
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('EverythingPresenceOneDevice was renamed to:', name);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('EverythingPresenceOneDevice has been deleted');
    this.client.disconnect();
    this.client.removeAllListeners();
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
}

module.exports = EverythingPresenceOneDevice;
