/**
 * @typedef {import('./model').default} Model
 * @typedef {Record<string, any>} ModelData
 * @typedef {new (...args: any[]) => Model} ModelConstructor
 * @typedef {Record<string, ModelConstructor> | Map<string, ModelConstructor>} ConstructorMap
 * @typedef {(obj: ModelData) => string|undefined} IdentityGetterFunction
 * @typedef {string | IdentityGetterFunction} IdentityGetter
 */
/**
 * Factory
 */
export default class Factory {
  /**
   * Construct a new Factory instance.
   * @param {ConstructorMap} constructorMap Identities mapped to constructors.
   * @param {IdentityGetter} [identityGetter] Name of identity attribute, or function for getting identity.
   */
  constructor(constructorMap, identityGetter) {
    // Require constructorMap
    if (isUndefined(constructorMap)) {
      throw new TypeError('constructorMap required.');
    }
    // Map for Constructors
    /**
     * @private
     * @type {ConstructorMap}
     */
    this._constructorMap = constructorMap;
    // identityGetter is function?
    /**
     * @private
     * @type {IdentityGetterFunction}
     */
    this._identityGetter = isFunction(identityGetter)
      ? /** @type {IdentityGetterFunction} */ (identityGetter)
      : getDefaultIdentityGetter(typeof identityGetter === 'string' ? identityGetter : 'identity');
  }
  /**
   * Get the identity key of object, e.g. 'mozy.Model'.
   * @param {ModelData} obj Object with polymorphic identity.
   * @return {string|undefined}
   */
  getIdentityOf(obj) {
    if (!isPlainObject(obj)) {
      throw new TypeError('Argument obj must be a plain object.');
    }
    return this._identityGetter(obj);
  }
  /**
   * Same as getIdentityOf, but throws error if undefined.
   * @param {ModelData} obj Object with polymorphic identity.
   * @return {string}
   */
  requireIdentityOf(obj) {
    const identity = this.getIdentityOf(obj);
    if (isUndefined(identity)) {
      throw new TypeError('Undefined identity in object.');
    }
    return /** @type {string} */ (identity);
  }
  /**
   * Check if object has identity.
   * @param {ModelData} obj Object with polymorphic identity.
   * @return {boolean}
   */
  hasIdentityDefined(obj) {
    return isUndefined(this.getIdentityOf(obj)) === false;
  }
  /**
   * Check if identity present in factory identity map.
   * @param {string} identity Identity of constructor.
   * @return {boolean}
   */
  isKnownIdentity(identity) {
    return isFunction(this.getConstructor(identity));
  }
  /**
   * Get Constructor registered for identity.
   * @param {String} identity Identity of constructor.
   * @return {ModelConstructor} Constructor
   */
  getConstructor(identity) {
    // Get constructor from identity
    if (this._constructorMap instanceof Map) {
      return /** @type {ModelConstructor} */ (this._constructorMap.get(identity));
    }
    if (hasGetMethod(this._constructorMap)) {
      const value = this._constructorMap.get(identity);
      if (value) {
        return value;
      }
    }
    return this._constructorMap[identity];
  }
  /**
   * Get Constructor registered for identity. Throw error if not found.
   * @param {String} identity Identity of constructor.
   * @return {ModelConstructor} Constructor
   */
  requireConstructor(identity) {
    // Get constructor from identity
    const Constructor = this.getConstructor(identity);
    // Not found
    if (!Constructor) {
      throw new TypeError('Constructor for identity "' + identity + '" not found. Not registered?');
    }
    return /** @type {ModelConstructor} */ (Constructor);
  }
  /**
   * Get Constructor registered for identity found in object.
   * @param {ModelData} obj Object with polymorphic identity.
   * @return {Function} Constructor
   */
  getConstructorFor(obj) {
    return this.getConstructor(this.requireIdentityOf(obj));
  }
  /**
   * Require Constructor registered for identity found in object.
   * @param {ModelData} obj Object with polymorphic identity.
   * @return {Function} Constructor
   */
  requireConstructorFor(obj) {
    return this.requireConstructor(this.requireIdentityOf(obj));
  }
  /**
   * Get new instance of Constructor registered for identity.
   * @param {string} identity Identity of constructor.
   * @param {...any} constructorArgs Arguments passed to Constructor.
   * @return {Model} Instance of Constructor.
   */
  newInstance(identity, ...constructorArgs) {
    // Get constrcutor from identity
    const Constructor = this.requireConstructor(identity);
    // Return new instance of Constructor
    return new Constructor(...constructorArgs);
  }
  /**
   * Get new instance of Constructor registered for identity in object.
   * @param {ModelData} obj Object with polymorphic identity.
   * @return {Model} Instance of Constructor for identity.
   */
  newInstanceFor(obj) {
    // Require identity in obj
    const identity = this.requireIdentityOf(obj);
    // Return new instance of Constructor for identity
    return this.newInstance(identity, obj);
  }

}

/**
 * Helper for getIdentityOf
 * @param {string} attr Name of attribute for getting identity in object.
 * @return {IdentityGetterFunction} Function for getting identity.
 */
function getDefaultIdentityGetter(attr) {
  return function(obj) {
    return obj[attr];
  };
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

/**
 * Check if value has get method
 * @param {ConstructorMap} value
 * @return {value is { get: (identity: string) => ModelConstructor | undefined}}
 */
function hasGetMethod(value) {
  return Boolean(value && typeof /** @type {any} */ (value).get === 'function' && !(value instanceof Map));
}

/**
 * Check if value is a plain object
 * @param {*} value
 * @returns {Boolean}
 */
function isPlainObject(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}
