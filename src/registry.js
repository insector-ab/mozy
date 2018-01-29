import ExtendableError from 'es6-error';
import Model from './model';
import Factory from './factory';

/**
 * Constants
 */
export const ALLOW_OVERRIDES = true;
export const DONT_ALLOW_OVERRIDES = false;
/**
 * Default options
 */
const defaultOptions = {
  // The attribute from which to get the registry key for models. E.g. "id", uuid" ..
  keyAttr: 'uuid',
  // Allow/disallow overriding of keys in registry.
  allowOverrides: DONT_ALLOW_OVERRIDES,
  // Function for validating keys
  keyValidator: key => typeof key === 'string'
};
/**
 * Registry
 */
export default class Registry {
  /**
   * Registry.constructor
   * @param {Factory|Function} factory Model factory.
   * @param {Object} options See defaultOptions.
   */
  constructor(factory, {map, ...options} = {}) {
    // Require valid factory
    if (!factory) {
      throw new TypeError('Argument factory required.');
    }
    // Factory for creating instances.
    this.factory = factory;
    // Map to use for registration
    this._map = map || new Map();
    // Options
    this._options = Object.assign({}, defaultOptions, options);
  }
  /**
   * Model factory.
   * @return {Factory|Function} Instance of Factory, or factory function
   */
  get factory() {
    return this._factory;
  }
  set factory(value) {
    if (!isValidFactory(value)) {
      throw new TypeError('Argument factory must be function or instance of mozy.Factory.');
    }
    this._factory = value;
  }
  /**
   * Registry options. See defaultOptions.
   * @return {Object} Options object.
   */
  get options() {
    return this._options;
  }
  /**
   * Get valid key from data object. Throw error if not valid.
   * @param {Object} data JSON serializable object.
   * @return {String} Key to register.
   */
  getValidKeyIn(data) {
    // Require data
    if (isUndefined(data)) {
      throw new TypeError('Argument data required.');
    }
    const keyAttr = this.options.keyAttr;
    const key = isFunction(keyAttr) ? keyAttr.call(this, data) : data[keyAttr];
    // Require valid
    if (!this.isValidKey(key)) {
      throw new InvalidRegistryKeyError(key, data);
    }
    // Return valid key
    return key;
  }
  /**
   * Get existing registration, key and model.
   * @param {Object} data JSON serializable object.
   * @return {Array} Registration entry [key, value].
   */
  getEntryForData(data) {
    // Key
    const key = this.getValidKeyIn(data);
    // If key is registered, return with model.
    if (this.has(key)) {
      return [key, this.get(key)];
    }
    // return without model
    return [key, undefined];
  }
  /**
   * Get existing model in registry or create new.
   * @param {Object} data JSON serializable object.
   * @param {Function} Constructor Make new model of type Constructor.
   * @return {Model} New or registered model.
   */
  getModel(data, Constructor) {
    let key, model;
    // If data has valid key, get key and model (if registered)
    if (this.dataHasValidKey(data)) {
      [key, model] = this.getEntryForData(data);
    }
    // No model found, create new model and register
    if (!model) {
      // New model
      if (Constructor) {
        model = new Constructor(data);
      } else {
        model = this.newInstanceFor(data);
      }
      // Get key in data
      key = this.getValidKeyIn(model.getModelData());
      // Register
      this.register(key, model);
    }
    // Return existing or new model
    return model;
  }
  /**
   * Create new model instance using factory.
   * @param {Object} data JSON serializable object.
   * @return {Model} New Model instance.
   */
  newInstanceFor(data) {
    // If mozy.Factory
    if (this.factory instanceof Factory) {
      return this.factory.newInstanceFor(data);
    }
    // If Function
    if (isFunction(this.factory)) {
      const factoryFunction = this.factory;
      return factoryFunction.call(this, data);
    }
    // No factory and no Constructor argument.
    throw new Error('Could not create model from data. Missing factory/constructor.');
  }
  /**
   * Register model.
   * @param {Model} model The model instance to register.
   * @return {Registry} The Registry object.
   */
  register(model) {
    // Get valid key
    const key = this.getValidKeyIn(model.getModelData());
    // Set in map
    return this.set(key, model);
  }
  /**
   * Unregister model.
   * @param {Model} model The model instance to unregister.
   * @return {boolean} True if model found and deleted.
   */
  unregister(model) {
    // Get valid key
    const key = this.getValidKeyIn(model.getModelData());
    // Delete in map
    return this.delete(key);
  }
  /**
   * Validate key and value. If not valid throw error.
   * @param {*} key The key to Validate.
   * @param {*} value Tha value to validate.
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
   * @param {Object} data JSON serializable object.
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
   * @param {*} key The key of the element to return from the Registry.
   * @return {*} The element associated with the specified key or undefined if the key can't be found in the Map object.
   */
  get(key) {
    return this._map.get(key);
  }
  /**
   * Map.set API
   * @param {*} key The key of the element to add to the Registry.
   * @param {*} value The value of the element to add to the Registry.
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
   * @param {*} key The key of the element to test for presence in the Registry.
   * @return {boolean} True if exists.
   */
  has(key) {
    return this._map.has(key);
  }
  /**
   * Map.delete API
   * @param {*} key The key of the element to delete from the Registry.
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
    // Clear registry
    this.clear();
    // delete refs
    this._deleteReferences();
  }
  /**
   * Delete references on instance.
   */
  _deleteReferences() {
    delete this._factory;
    delete this._map;
    delete this._options;
  }

}

// Store multitons
Registry._instances = new Map();

// Multiton getter
Registry.get = function(name, ...constructorArgs) {
  // Instance exists?
  if (Registry._instances.has(name)) {
    return Registry._instances.get(name);
  }
  // Create new Registry
  const reg = new Registry(...constructorArgs);
  // Register
  Registry._instances.set(name, reg);
  // return
  return reg;
};

/**
 * InvalidRegistryKeyError
 */
export class InvalidRegistryKeyError extends ExtendableError {

  constructor(key, data) {
    let lines = ['Invalid key "' + key + '" for getting instance from registry.'];
    if (data) {
      lines.push('Data: ' + JSON.stringify(data));
    }
    super(lines.join(' '));
  }

}

/**
 * Check if value is valid factory type
 * @param  {*} value Value to check
 * @return {Boolean} True if valie
 */
function isValidFactory(value) {
  if (!value) {
    return false;
  }
  if (!(isFunction(value) || value instanceof Factory)) {
    return false;
  }
  return true;
}
/**
 * Check if value is undefined
 * @param  {*} value
 * @return {Boolean} True if undefined
 */
function isUndefined(value) {
  return typeof value === 'undefined';
}
/**
 * Check if value is function
 * @param  {*} value
 * @return {Boolean} True if undefined
 */
function isFunction(value) {
  return typeof value === 'function';
}
