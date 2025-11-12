import EventEmitter from 'eventemitter3';
import { v4 as uuidV4 } from 'uuid';

const UUID_ATTR_REGEXP = /"uuid":".*?"/g;
// https://gist.github.com/johnelliott/cf77003f72f889abbc3f32785fa3df8d
const UUID_V4_REGEXP = /[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/i;

/**
 * @typedef {Record<string, any>} ModelData
 * @typedef {{ setSilent?: boolean, unsetIfFalsy?: boolean }} SetOptions
 * @typedef {{ setSilent?: boolean }} AssignOptions
 */

/**
 * Model
 */
export default class Model extends EventEmitter {
  /**
   * Model.constructor
   * @param {ModelData} [data] JSON serializable object.
   * @param {...any} args Arguments passed to _getDefaults().
   */
  constructor(data = {}, ...args) {
    super();
    // Set from parsed default data
    /** @type {ModelData} */
    this._data = this._withDefaultData(this._parseData(data), ...args);
    // Store previous
    /** @type {ModelData} */
    this._previousData = {};
  }
  /**
   * Get uuid.
   * @return {string}
   */
  get uuid() {
    return this.get('uuid');
  }
  /**
   * Underlying data object for model.
   * @return {string} Model polymorphic identity.
   */
  getModelIdentity() {
    return this.get('identity');
  }
  /**
   * Cloned underlying data object for model.
   * @return {ModelData} JSON serializable object.
   */
  getDeepClonedModelData() {
    return cloneData(this._data);
  }
  /**
   * JSON.stringify() interface. Alias of getModelData.
   * @return {ModelData} JSON serializable object.
   */
  toJSON() {
    return this.getDataReference();
  }
  /**
   * Underlying data object reference.
    * @return {ModelData} JSON serializable object.
   */
  getDataReference() {
    return this._data;
  }
  /**
   * Get value of data.property.
   * @param {string} property Name of property.
   * @param {*} [defaultValue] Default value to return if property is undefined.
   * @return {*}
   */
  get(property, defaultValue) {
    return this.has(property) ? this._data[property] : defaultValue;
  }
  /**
   * Return previous value of property.
   * @param {string} property Name of property.
   * @return {*}
   */
  getPrevious(property) {
    return this._previousData[property];
  }
  /**
   * Check if property is set in data.
   * @param {string} property Name of property.
   * @return {boolean} True if set.
   */
  has(property) {
    return Object.prototype.hasOwnProperty.call(this._data, property);
  }
  /**
   * Check if previous value of property is same
   * as current.
   * @param {...string} properties Names of properties.
   * @return {boolean} True if any of them has changed.
   */
  hasChanged(...properties) {
    return properties.some(prop => this._previousData[prop] !== this._data[prop]);
  }
  /**
   * Set value of data.property.
   * @param {string} property Name of property.
   * @param {*} value Anything JSON serializable.
   * @param {SetOptions} [flags]
   * @return {Model} The Model object.
   */
  set(property, value, { setSilent, unsetIfFalsy } = {}) {
    // Previous value
    this._previousData[property] = this._data[property];
    // Unset if falsy
    if (unsetIfFalsy && !value) {
      value = undefined;
    }
    // If value different
    if (value !== this._data[property]) {
      // If value undefined, delete
      if (typeof value === 'undefined') {
        delete this._data[property];
      // Set new value
      } else {
        this._data[property] = value;
      }
      // Dispatch change event, if not silent
      if (!setSilent) {
        this.dispatchChange(property, value, this._previousData[property]);
      }
    }
    // Return
    return this;
  }
  /**
   * Toggle boolean property.
   * @param {string} property Name of property.
   * @param {SetOptions} [flags]
   * @return {Model} The Model object.
   */
  toggle(property, flags = {}) {
    const current = this.get(property, false); // False if not set
    return this.set(property, !current, flags); // Set to !current
  }
  /**
   * Unset value of data.property.
   * @param {string} property Name of property.
   * @param {SetOptions} [flags]
   * @return {Model} The Model object.
   */
  unset(property, flags = {}) {
    return this.set(property, undefined, flags);
  }
  /**
   * Reset underlying data object for model.
   * @param {ModelData} defaultData JSON serializable object.
   * @param {AssignOptions} [flags]
   * @return {Model} The Model object.
   */
  resetData(defaultData, flags = {}) {
    let data = {};
    // Keep uuid and identity
    const { uuid, identity } = this._data;
    Object.assign(data, { uuid, identity });
    // Update data with defaults
    data = Object.assign(this._withDefaultData(data), this._parseData(defaultData));
    // Clear _data
    Object.keys(this._data).forEach(property => {
      delete this._data[property];
    });
    // Assign new data and return this
    return this.assignData(data, flags);
  }
  /**
   * Assign new data to underlying _data object.
   * @param {ModelData} newData JSON serializable object.
   * @param {AssignOptions} [flags]
   * @return {Model} The Model object.
   */
  assignData(newData, { setSilent } = {}) {
    let didChange = false;
    // Assign previous data
    Object.keys(newData).forEach(property => {
      const previous = this._data[property];
      this._previousData[property] = previous;
      if (!didChange && newData[property] !== previous) {
        didChange = true;
      }
    });
    // Assign new data
    Object.assign(this._data, newData);
    // Notify if not silent and something changed.
    if (!setSilent && didChange) {
      this.dispatchChange();
    }
    // Return
    return this;
  }
  /**
   * Return a copy of this model, with new uuids.
   * FIX: Better way to do this?
   * @return {Model} New instance of Model (or Model subclass).
   */
  copy() {
    // stringify data dict
    let jsonStr = JSON.stringify(this.getDataReference());
    // Create Uuid map
    const uuidMap = (jsonStr.match(UUID_ATTR_REGEXP) || []).reduce((acc, matchStr) => {
      const match = matchStr.match(UUID_V4_REGEXP);
      if (match) {
        const current = match[0];
        if (!acc[current]) {
          acc[current] = uuidV4();
        }
      }
      return acc;
    }, /** @type {Record<string, string>} */ ({}));
    // Replace current uuids with new one's
    jsonStr = Object.keys(uuidMap).reduce((acc, oldUuid) => acc.split(oldUuid).join(uuidMap[oldUuid]), jsonStr);
    // return instance of this
    const Constructor = /** @type {new (data: ModelData) => Model} */ (this.constructor);
    return new Constructor(JSON.parse(jsonStr));
  }
  /**
   * Interface for dispatching events.
   * Currently alias for EventEmitter.emit. May change.
   * @param {string} eventType Event type key.
   * @param {...any} args Arguments passed to listeners.
   * @return {Model} The Model object.
   */
  dispatchEvent(eventType, ...args) {
    this.emit(eventType, ...[eventType, this].concat(args));
    // Return
    return this;
  }
  /**
   * Dispatch change events.
   * @param {string} [property] Name of property.
   * @param {*} [newValue] Anything JSON serializable.
   * @param {*} [oldValue] Anything JSON serializable.
   * @return {Model} The Model object.
   */
  dispatchChange(property, newValue, oldValue) {
    if (property) {
      this.dispatchEvent('change ' + property, newValue, oldValue);
    }
    return this.dispatchEvent('change');
  }
  /**
   * Alias for EventEmitter.addListener
   * @param {string} event
   * @param {(eventType: string, sender: Model, ...args: any[]) => void} listener
   * @return {Model}
   */
  addEventListener(event, listener) {
    this.addListener(event, listener);
    // Return
    return this;
  }
  /**
   * Alias for EventEmitter.removeListener
   * @param {string} event
   * @param {(eventType: string, sender: Model, ...args: any[]) => void} listener
   * @return {Model}
   */
  removeEventListener(event, listener) {
    this.removeListener(event, listener);
    // Return
    return this;
  }
  /**
   * Dispose model and sub models recursively.
   * Remove event listeners and delete references.
   * @return {Model} The Model object.
   */
  dispose() {
    // Remove event listeners
    this.removeAllListeners();
    // delete refs
    this._deleteReferences();
    // Return
    return this;
  }
  /**
   * Parse data object for model.
   * @param {ModelData} data object for model.
   * @return {ModelData} Default data (JSON serializable object) for Model.
   */
  _parseData(data) {
    return data;
  }
  /**
   * Return default data object for new instance.
   * @param {...any} constructorArgs
   * @return {ModelData}
   */
  _getDefaults(...constructorArgs) {
    return {
      // Model polymorphic identity
      identity: Model.identity,
      // model uuid
      uuid: uuidV4()
    };
  }
  /**
   * Assign defaults to data argument.
   * @param {ModelData} data JSON serializable object.
   * @param {...any} constructorArgs
   * @return {ModelData}
   */
  _withDefaultData(data, ...constructorArgs) {
    // Get defaults
    const defaults = this._getDefaults(...constructorArgs);
    for (const key in defaults) {
      if (!Object.prototype.hasOwnProperty.call(defaults, key)) {
        continue;
      }
      if (this._shouldSetDefaultValue(key, data[key])) {
        data[key] = defaults[key];
      }
    }
    // Return
    return data;
  }
  /**
   * Return true if _withDefaultData should set the default
   * value for this property. Override to also set defaults
   * for null values, for example.
   * @param {String} property Name of property.
   * @param {*} value Anything JSON serializable.
   * @return {Boolean}
   */
  _shouldSetDefaultValue(property, value) {
    return typeof value === 'undefined';
  }
  /**
   * Delete references set on model.
   */
  _deleteReferences() {
    this._data = /** @type {ModelData} */ (/** @type {unknown} */ (undefined));
    this._previousData = /** @type {ModelData} */ (/** @type {unknown} */ (undefined));
  }

}
// Polymorphic identity
Model.identity = 'mozy.Model';

/**
 * Model identities
 */
export const identities = new Map();

// Register Model
identities.set(Model.identity, Model);

const hasStructuredClone = typeof globalThis !== 'undefined' && typeof globalThis.structuredClone === 'function';
const structuredCloneFn = hasStructuredClone ? globalThis.structuredClone : undefined;

/**
 * @param {*} value
 * @return {*}
 */
function cloneData(value) {
  if (structuredCloneFn) {
    return structuredCloneFn(value);
  }
  return cloneFallback(value);
}

/**
 * @param {*} value
 * @return {*}
 */
function cloneFallback(value) {
  if (Array.isArray(value)) {
    return Array.from(value, cloneFallback);
  }
  if (value && typeof value === 'object') {
    const obj = /** @type {Record<string, any>} */ (value);
    const clone = /** @type {Record<string, any>} */ ({});
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = cloneFallback(obj[key]);
      }
    }
    return clone;
  }
  return value;
}
