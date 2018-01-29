/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import chai from 'chai';
import {Model, Factory, modelIdentities} from '../index';
import {Rect, EdgeSizes, Dimensions} from './layout';

const should = chai.should();

/**
 * Helper class for test
 */
class CustomMap {
  constructor(iterable) {
    this._map = Object.create(null);
    for (let [key, value] of iterable) {
      this._map[key] = value;
    }
  }
  get(key) {
    return this._map[key];
  }
}

/**
 * Use case helper
 */
function describeWithMap(map) {
  // No constructor errors
  it('should instantiate without error', function() {
    const newFactory = function() { return new Factory(map); };
    newFactory.should.not.throw(Error);
  });
  // New instance
  it('should return new instance of existing identity', function() {
    const factory = new Factory(map);
    const dim = factory.newInstance(Dimensions.identity);
    dim.should.be.an.instanceof(Dimensions);
  });
  // Non existing
  it('should throw error for non-existing identity', function() {
    const factory = new Factory(map);
    const newInstance = function() { return factory.newInstance('non-existing-identity'); };
    newInstance.should.throw(TypeError);
  });
}

/**
 * Factory tests
 */
describe('Factory', () => {

  // Use cases
  describe('Use cases', () => {

    // Object as map
    describe('Using Object as map', () => {
      const objMap = {
        [Rect.identity]: Rect,
        [EdgeSizes.identity]: EdgeSizes,
        [Dimensions.identity]: Dimensions
      };
      // Describe with map
      describeWithMap(objMap);
    });

    // Map as map
    describe('Using ES6 Map', () => {
      const es6Map = new Map([
        [Rect.identity, Rect],
        [EdgeSizes.identity, EdgeSizes],
        [Dimensions.identity, Dimensions]
      ]);
      // Describe with map
      describeWithMap(es6Map);
    });

    // Custom object with .get method
    describe('Using object that implements .get() method', () => {
      const customMap = new CustomMap([
        [Rect.identity, Rect],
        [EdgeSizes.identity, EdgeSizes],
        [Dimensions.identity, Dimensions]
      ]);
      // Describe with map
      describeWithMap(customMap);
    });

  });

  // API
  describe('API', () => {

    // Constructor
    describe('constructor(constructorMap, identityGetter)', () => {

      it('should require constructorMap', function() {
        const newInstanceWithoutArgs = function() { return new Factory(); };
        newInstanceWithoutArgs.should.throw(TypeError);
      });

    });

    // Method: getIdentityOf
    describe('.getIdentityOf(obj)', () => {
      const factory = new Factory(modelIdentities);
      const model = new Model();

      it('should require an object as argument', function() {
        const getIdentityOfUndefined = function() { factory.getIdentityOf(); };
        getIdentityOfUndefined.should.throw(TypeError);
      });

      it('should return undefined for an empty object', function() {
        should.equal(factory.getIdentityOf({}), undefined);
      });

      it('should return Model.identity for (new Model()).getModelData()', function() {
        factory.getIdentityOf(model.getModelData()).should.equal(Model.identity);
      });

    });

    // Method: requireIdentityOf
    describe('.requireIdentityOf(obj)', () => {
      const factory = new Factory(modelIdentities);
      const model = new Model();

      it('should require an object as argument', function() {
        const requireIdentityOfUndefined = function() { factory.requireIdentityOf(); };
        requireIdentityOfUndefined.should.throw(TypeError);
      });

      it('should throw TypeError if identity not found', function() {
        const requireIdentityOfEmptyObj = function() { factory.requireIdentityOf({}); };
        requireIdentityOfEmptyObj.should.throw(TypeError);
      });

      it('should return Model.identity for (new Model()).getModelData()', function() {
        factory.requireIdentityOf(model.getModelData()).should.equal(Model.identity);
      });

    });

    // Method: hasIdentityDefined
    describe('.hasIdentityDefined(obj)', () => {
      const factory = new Factory(modelIdentities);
      const model = new Model();

      it('should require an object as argument', function() {
        const undefinedHasIdentity = function() { factory.hasIdentityDefined(); };
        undefinedHasIdentity.should.throw(TypeError);
      });

      it('should return false for empty object', function() {
        factory.hasIdentityDefined({}).should.be.false;
      });

      it('should return true if identity defined in object', function() {
        factory.hasIdentityDefined({identity: 'unknown.identity'}).should.be.true;
      });

      it('should return true for model data', function() {
        factory.hasIdentityDefined(model.getModelData()).should.be.true;
      });

    });

    // Method: isKnownIdentity
    describe('.isKnownIdentity(identity)', () => {
      const factory = new Factory(modelIdentities);

      it('should return true for identity present in factory\'s identity map', function() {
        factory.isKnownIdentity(Model.identity).should.be.true;
      });

      it('should return false for identity NOT present in factory\'s identity map', function() {
        factory.isKnownIdentity().should.be.false;
        factory.isKnownIdentity('an.unknown.identity').should.be.false;
        factory.isKnownIdentity({}).should.be.false;
      });

    });

    // Method: getConstructor
    describe('.getConstructor(identity)', () => {
      const factory = new Factory(modelIdentities);

      it('should return a function for identity present in factory\'s identity map', function() {
        factory.getConstructor(Model.identity).should.be.a('function');
      });

      it('should return undefined for identity NOT present in factory\'s identity map', function() {
        should.equal(factory.getConstructor(), undefined);
        should.equal(factory.getConstructor('an.unknown.identity'), undefined);
        should.equal(factory.getConstructor({}), undefined);
      });

    });

    // Method: requireConstructor
    describe('.requireConstructor(identity)', () => {
      const factory = new Factory(modelIdentities);

      it('should return a function for identity present in factory\'s identity map', function() {
        factory.requireConstructor(Model.identity).should.be.a('function');
      });

      it('should throw error for identity NOT present in factory\'s identity map', function() {
        const requireConstructorOfUnknown = function() {
          factory.requireConstructor();
          factory.requireConstructor('an.unknown.identity');
          factory.requireConstructor({});
        };
        requireConstructorOfUnknown.should.throw(TypeError);
      });

    });

  });

});
