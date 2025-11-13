import Model from './model.js';
import Factory from './factory.js';

/**
 * @typedef {Record<string, any>} ModelData
 * @typedef {Map<string, Model>} ModelMap
 * @typedef {new (...args: any[]) => Model} ModelConstructor
 * @typedef {(data: ModelData) => Model} FactoryFunction
 * @typedef {Factory | FactoryFunction} RegistryFactory
 * @typedef {{
 *   keyAttr: string | ((this: Registry, data: ModelData) => string),
 *   allowOverrides: boolean,
 *   keyValidator: (key: any) => boolean,
 *   map?: ModelMap
 * }} RegistryOptions
 */

/**
 * Constants
 */
export const ALLOW_OVERRIDES = true;
export const DONT_ALLOW_OVERRIDES = false;
/**
 * Default options
 */
const defaultOptions = /** @type {RegistryOptions} */ ({
  // The attribute from which to get the registry key for models. E.g. "id", uuid" ..
  keyAttr: 'uuid',
  // Allow/disallow overriding of keys in registry.
  allowOverrides: DONT_ALLOW_OVERRIDES,
  // Function for validating keys
  keyValidator: /** @type {(key: any) => boolean} */ (key => typeof key === 'string')
});
/**
 * Registry
 */
export default class Registry {
  /**
   * Registry.constructor
   * @param {RegistryFactory} factory Model factory.
   * @param {RegistryOptions} [options] See defaultOptions.
   */
  constructor(factory, options) {
    const { map, ...restOptions } = Object.assign({}, defaultOptions, (options || {}));
    // Require valid factory
    if (!factory) {
      throw new TypeError('Argument factory required.');
    }
    // Factory for creating instances.
    this.factory = factory;
    // Map to use for registration
    /** @type {ModelMap} */
    this._map = map || new Map();
    // Options
    this._options = restOptions;
    /**
     * @private
     * @type {(data: ModelData) => string}
     */
    this._keyGetter = this._createKeyGetter(this._options.keyAttr);
  }
  /**
   * Model factory.
   * @return {RegistryFactory} Instance of Factory, or factory function
   */
  get factory() {
    if (!this._factory) {
      throw new TypeError('Registry factory not initialized.');
    }
    return this._factory;
  }
  /**
   * @param {RegistryFactory} value
   */
  set factory(value) {
    if (!isValidFactory(value)) {
      throw new TypeError('Argument factory must be function or instance of mozy.Factory.');
    }
    this._factory = value;
  }
  /**
   * Registry options. See defaultOptions.
   * @return {RegistryOptions} Options object.
   */
  get options() {
    return this._options;
  }
  /**
   * Get valid key from data object. Throw error if not valid.
   * @param {ModelData} data JSON serializable object.
   * @return {string} Key to register.
   */
  getValidKeyIn(data) {
    // Require data
    if (isUndefined(data)) {
      throw new TypeError('Argument data required.');
    }
    const key = this._keyGetter(data);
    // Require valid
    if (!this.isValidKey(key)) {
      throw new InvalidRegistryKeyError(key, data);
    }
    // Return valid key
    return key;
  }
  /**
   * Get existing model in registry or create new.
   * @param {ModelData} data JSON serializable object.
   * @param {ModelConstructor} [Constructor] Make new model of type Constructor.
   * @return {Model} New or registered model.
   */
  getModel(data, Constructor) {
    let cachedKey;
    // Try registered model
    try {
      cachedKey = this.getValidKeyIn(data);
      // If key is registered, return model.
      if (this.has(cachedKey)) {
        return /** @type {Model} */ (this.get(cachedKey));
      }
    } catch (e) {
      if (!(e instanceof InvalidRegistryKeyError)) {
        throw e;
      }
    }
    // Key not found, create new model
    const model = Constructor ? new Constructor(data) : this.newInstanceFor(data);
    // Register
    this.register(model, cachedKey);
    // Return new model
    return model;
  }
  /**
   * Create new model instance using factory.
   * @param {ModelData} data JSON serializable object.
   * @return {Model} New Model instance.
   */
  newInstanceFor(data) {
    // If mozy.Factory
    if (this.factory instanceof Factory) {
      return this.factory.newInstanceFor(data);
    }
    // If Function
    if (typeof this.factory === 'function') {
      const factoryFunction = /** @type {FactoryFunction} */ (this.factory);
      return factoryFunction.call(this, data);
    }
    // No factory and no Constructor argument.
    throw new Error('Could not create model from data. Missing factory/constructor.');
  }
  /**
   * Register model.
   * @param {Model} model The model instance to register.
   * @param {string} [key]
   * @return {Registry} The Registry object.
   */
  register(model, key) {
    // Get valid key
    const resolvedKey = typeof key === 'undefined'
      ? this.getValidKeyIn(model.getDataReference())
      : key;
    // Set in map
    return this.set(resolvedKey, model);
  }
  /**
   * Unregister model.
   * @param {Model} model The model instance to unregister.
   * @param {string} [key]
   * @return {boolean} True if model found and deleted.
   */
  unregister(model, key) {
    // Get valid key
    const resolvedKey = typeof key === 'undefined'
      ? this.getValidKeyIn(model.getDataReference())
      : key;
    // Delete in map
    return this.delete(resolvedKey);
  }
  /**
   * Validate key and value. If not valid throw error.
   * @param {*} key The key to Validate.
   * @param {Model} value The value to validate.
   * @return {Registry} The Registry object.
   */
  validate(key, value) {
    // Valid key?
    if (!this.isValidKey(key)) {
      throw new InvalidRegistryKeyError(key);
    }
    // Allow?
    if (this.has(key) && this.options.allowOverrides === DONT_ALLOW_OVERRIDES) {
      throw new Error(this.constructor.name + ' key "' + key + '" already registered.');
    }
    // value must be instance of Model
    if (!(value instanceof Model)) {
      throw new TypeError('Registry value must be instance of Model.');
    }
    return this;
  }
  /**
   * Check if key is valid for registration.
   * @param {*} key The key of the element to return from the Registry.
   * @return {boolean} True if valid.
   */
  isValidKey(key) {
    if (isFunction(this.options.keyValidator)) {
      return this.options.keyValidator(key);
    }
    // No validation
    return true;
  }
  /**
   * Check if data object has a valid key for registration.
   * @param {ModelData} data JSON serializable object.
   * @return {boolean} True if valid.
   */
  dataHasValidKey(data) {
    try {
      this.getValidKeyIn(data);
    } catch (err) {
      if (err instanceof InvalidRegistryKeyError) {
        return false;
      }
      throw err;
    }
    return true;
  }
  /**
   * Map.get API
   * @param {string} key The key of the element to return from the Registry.
   * @return {Model|undefined} The element associated with the specified key or undefined if the key can't be found in the Map object.
   */
  get(key) {
    return this._map.get(key);
  }
  /**
   * Map.set API
   * @param {string} key The key of the element to add to the Registry.
   * @param {Model} value The value of the element to add to the Registry.
   * @return {Registry} The Registry object.
   */
  set(key, value) {
    // Validate
    this.validate(key, value);
    // register
    this._map.set(key, value);
    // Return
    return this;
  }
  /**
   * Map.has API
   * @param {string} key The key of the element to test for presence in the Registry.
   * @return {boolean} True if exists.
   */
  has(key) {
    return this._map.has(key);
  }
  /**
   * Map.delete API
   * @param {string} key The key of the element to delete from the Registry.
   * @return {boolean} True if key found and deleted.
   */
  delete(key) {
    return this._map.delete(key);
  }
  /**
   * Map.clear API
   */
  clear() {
    this._map.clear();
  }
  /**
   * Dispose registry. Clear map and delete references.
   */
  dispose() {
    // Already disposed?
    if (!Object.prototype.hasOwnProperty.call(this, '_map')) {
      return;
    }
    // Clear registry
    this.clear();
    // delete refs
    this._deleteReferences();
  }
  /**
   * @private
   * @param {RegistryOptions['keyAttr']} attr
   * @return {(data: ModelData) => string}
   */
  _createKeyGetter(attr) {
    if (isFunction(attr)) {
      return data => /** @type {string} */ (attr.call(this, data));
    }
    return data => /** @type {string} */ (data[attr]);
  }
  /**
   * Delete references on instance.
   */
  _deleteReferences() {
    this._factory = /** @type {RegistryFactory} */ (/** @type {unknown} */ (undefined));
    this._map = /** @type {ModelMap} */ (/** @type {unknown} */ (undefined));
    this._options = /** @type {RegistryOptions} */ (/** @type {unknown} */ (undefined));
    this._keyGetter = /** @type {(data: ModelData) => string} */ (/** @type {unknown} */ (undefined));
  }

}

// Store multitons
/** @type {Map<string, Registry>} */
Registry._instances = new Map();

// Multiton getter
/**
 * @param {string} name Registry name.
 * @param {RegistryFactory} factory
 * @param {RegistryOptions} [options]
 * @return {Registry}
 */
Registry.get = function(name, factory, options) {
  // Instance exists?
  if (Registry._instances.has(name)) {
    return /** @type {Registry} */ (Registry._instances.get(name));
  }
  // Create new Registry
  const reg = new Registry(factory, options);
  // Register
  Registry._instances.set(name, reg);
  // return
  return reg;
};

/**
 * InvalidRegistryKeyError
 */
export class InvalidRegistryKeyError extends Error {

  /**
   * @param {string|undefined} key
   * @param {ModelData} [data]
   */
  constructor(key, data) {
    const lines = ['Invalid key "' + key + '" for getting instance from registry.'];
    if (data) {
      lines.push('Data: ' + JSON.stringify(data));
    }
    super(lines.join(' '));
    this.name = 'InvalidRegistryKeyError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidRegistryKeyError);
    }
  }

}

/**
 * Check if value is valid factory type
 * @param {*} value
 * @return {value is RegistryFactory}
 */
function isValidFactory(value) {
  return Boolean(value) && (value instanceof Factory || typeof value === 'function');
}
/**
 * Check if value is undefined
 * @param  {*} value
 * @return {value is undefined}
 */
function isUndefined(value) {
  return typeof value === 'undefined';
}
/**
 * Check if value is function
 * @param  {*} value
 * @return {value is Function}
 */
function isFunction(value) {
  return typeof value === 'function';
}
