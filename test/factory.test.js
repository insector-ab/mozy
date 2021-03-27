/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import chai from 'chai';

import {
  Model,
  Factory,
  modelIdentities
} from '../src/index';

import {
  Rect,
  EdgeSizes,
  Dimensions
} from './layout';

const should = chai.should();

/**
 * Helper class for test
 */
class CustomMap {
  constructor(iterable) {
    this._map = Object.create(null);
    for (const [key, value] of iterable) {
      this._map[key] = value;
    }
  }
  get(key) {
    return this._map[key];
  }
}

/**
 * Factory tests
 */
describe('Factory', () => {

  describe('Use cases', () => {

    describe('New instance with map argument type:', () => {

      // Describe helper
      function describeWithMap(typeDescription, map) {
        describe(typeDescription, () => {

          it('should instantiate without error', function() {
            const newFactory = function() { return new Factory(map); };
            newFactory.should.not.throw(Error);
          });

          it('should return new instance of existing identity', function() {
            const factory = new Factory(map);
            const dim = factory.newInstance(Dimensions.identity);
            dim.should.be.an.instanceof(Dimensions);
          });

          it('should throw error for non-existing identity', function() {
            const factory = new Factory(map);
            const newInstance = function() { return factory.newInstance('non-existing-identity'); };
            newInstance.should.throw(TypeError);
          });

        });
      }

      const identityObj = {
        [Rect.identity]: Rect,
        [EdgeSizes.identity]: EdgeSizes,
        [Dimensions.identity]: Dimensions
      };
      const identityEntries = Object.entries(identityObj);

      describeWithMap('object', identityObj);
      describeWithMap('ES6 Map', new Map(identityEntries));
      describeWithMap('object that has .get() method', new CustomMap(identityEntries));

    });

    describe('New instance using an identityGetter', () => {

      it('should return new instance of computed identity', function() {
        const factory = new Factory(modelIdentities, obj => 'mozy.' + obj.discriminator);
        const model = factory.newInstanceFor({ discriminator: 'Model' });
        model.should.be.an.instanceof(Model);
      });

    });

  });

  // Interface
  describe('Interface', () => {

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

      it('should return Model.identity for (new Model()).getDataReference()', function() {
        factory.getIdentityOf(model.getDataReference()).should.equal(Model.identity);
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

      it('should return Model.identity for (new Model()).getDataReference()', function() {
        factory.requireIdentityOf(model.getDataReference()).should.equal(Model.identity);
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
        factory.hasIdentityDefined({ identity: 'unknown.identity' }).should.be.true;
      });

      it('should return true for model data', function() {
        factory.hasIdentityDefined(model.getDataReference()).should.be.true;
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

    // Method: getConstructorFor
    describe('.getConstructorFor(obj)', () => {
      const factory = new Factory(modelIdentities);
      const model = new Model();

      it('should return a function for object with identity present in factory\'s identity map', function() {
        factory.getConstructorFor(model.getDataReference()).should.be.a('function');
      });

      it('should return undefined for object with identity NOT present in factory\'s identity map', function() {
        should.equal(factory.getConstructorFor({ identity: 'an.unknown.identity' }), undefined);
      });

    });

    // Method: requireConstructorFor
    describe('.requireConstructorFor(obj)', () => {
      const factory = new Factory(modelIdentities);
      const model = new Model();

      it('should return a function for object with identity present in factory\'s identity map', function() {
        factory.requireConstructorFor(model.getDataReference()).should.be.a('function');
      });

      it('should throw error for identity NOT present in factory\'s identity map', function() {
        const requireConstructorForObjectWithUnknownIdentity = function() {
          factory.requireConstructorFor({ identity: 'an.unknown.identity' });
        };
        requireConstructorForObjectWithUnknownIdentity.should.throw(TypeError);
      });

    });

    // Method: newInstance
    describe('.newInstance(identity, ...constructorArgs)', () => {
      const factory = new Factory(modelIdentities);

      it('should return an instance for identity present in factory\'s identity map', function() {
        factory.newInstance(Model.identity).should.be.an.instanceof(Model);
      });

      it('should throw error for identity NOT present in factory\'s identity map', function() {
        const newInstanceOfUnknownIdentity = function() {
          factory.newInstance('an.unknown.identity');
        };
        newInstanceOfUnknownIdentity.should.throw(TypeError);
      });

    });

    // Method: newInstanceFor
    describe('.newInstanceFor(obj, ...constructorArgs)', () => {
      const factory = new Factory(modelIdentities);

      it('should return an instance for object with identity present in factory\'s identity map', function() {
        factory.newInstanceFor({ identity: Model.identity }).should.be.an.instanceof(Model);
      });

      it('should throw error for object with identity NOT present in factory\'s identity map', function() {
        const newInstanceOfUnknownIdentity = function() {
          factory.newInstance({ identity: 'an.unknown.identity' });
        };
        newInstanceOfUnknownIdentity.should.throw(TypeError);
      });

    });

  });

});
