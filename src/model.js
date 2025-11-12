import EventEmitter from 'eventemitter3';
import { v4 as uuidV4 } from 'uuid';

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
    this._data = this._withDefaultData(this._parseData(data), ...args);
    // Store previous
    this._previousData = {};
  }
  /**
   * Get uuid.
   * @return {string|undefined}
   */
  get uuid() {
    return this.get('uuid');
  }
  /**
   * Underlying data object for model.
   * @return {String} Model polymorphic identity.
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
   * @param {*} defaultValue Default value to return if property is undefined.
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
    // replace all "uuid" values with new one's.
    const uuidAttrRegexp = /"uuid":".*?"/g;
    // Uuid V4 regexp
    // https://gist.github.com/johnelliott/cf77003f72f889abbc3f32785fa3df8d
    const uuidRegexp = /[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/i;
    // Create Uuid map
    const uuidMap = (jsonStr.match(uuidAttrRegexp) || [])
      .map(matchStr => matchStr.match(uuidRegexp)[0])
      .reduce((acc, uuid) => {
        if (!acc[uuid]) {
          acc[uuid] = uuidV4();
        }
        return acc;
      }, {});
    // Replace current uuids with new one's
    jsonStr = Object.keys(uuidMap).reduce((acc, oldUuid) => {
      acc = acc.replace(RegExp(oldUuid, 'g'), uuidMap[oldUuid]);
      return acc;
    }, jsonStr);
    // return instance of this
    const Constructor = this.constructor;
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
   * @param {*} newValue Anything JSON serializable.
   * @param {*} oldValue Anything JSON serializable.
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
   */
  addEventListener(event, listener) {
    this.addListener(event, listener);
    // Return
    return this;
  }
  /**
   * Alias for EventEmitter.removeListener
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
   * @param {...} data object for model.
   * @return {Object} Default data (JSON serializable object) for Model.
   */
  _parseData(data) {
    return data;
  }
  /**
   * Return default data object for new instance.
   * @param {...} constructorArgs List of arguments passed in constructor.
   * @return {Object} Default data (JSON serializable object) for Model.
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
   * @param {Object} defaultData JSON serializable object.
   * @param {...} constructorArgs List of arguments passed in constructor.
   * @return {Object} Default data (JSON serializable object) for Model.
   */
  _withDefaultData(data, ...constructorArgs) {
    // Get defaults
    const defaults = Object.entries(this._getDefaults(...constructorArgs))
      .filter(entry => this._shouldSetDefaultValue(entry[0], data[entry[0]]))
      .reduce((d, entry) => { d[entry[0]] = entry[1]; return d; }, {});
    // Assign to data
    Object.keys(defaults).forEach(key => {
      data[key] = defaults[key];
    });
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
    delete this._data;
    delete this._previousData;
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

function cloneData(value) {
  if (hasStructuredClone) {
    return globalThis.structuredClone(value);
  }
  return cloneFallback(value);
}

function cloneFallback(value) {
  if (Array.isArray(value)) {
    return value.map(cloneFallback);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = cloneFallback(value[key]);
      return acc;
    }, {});
  }
  return value;
}
