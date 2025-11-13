/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import * as chai from 'chai';

import {
  Factory,
  Model,
  Registry,
  modelIdentities,
  modelRegistry
} from '../src/index.js';
import {
  ALLOW_OVERRIDES,
  InvalidRegistryKeyError
} from '../src/registry.js';

chai.should();
const { expect } = chai;

function createRegistry(options = {}) {
  return new Registry(new Factory(modelIdentities), options);
}

describe('Registry', () => {

  // Use cases
  describe('Use cases', () => {
    // Write
  });

  // Interface
  describe('Interface', () => {

    describe('constructor(factory, map, options = {})', () => {

      it('should require a factory', function() {
        const newInstanceWithoutArgs = function() { return new Registry(); };
        newInstanceWithoutArgs.should.throw(TypeError);
      });

    });

    describe('.getValidKeyIn(data)', () => {

      it('should throw when data missing or invalid', function() {
        const registry = createRegistry({
          keyValidator: key => typeof key === 'string' && key.startsWith('valid-')
        });
        (() => registry.getValidKeyIn()).should.throw(TypeError);
        (() => registry.getValidKeyIn({ uuid: 'bad' })).should.throw(InvalidRegistryKeyError);
      });

      it('should use custom key extractor functions', function() {
        const registry = createRegistry({
          keyAttr: data => `custom-${data.uuid}`
        });
        const validKey = registry.getValidKeyIn({ uuid: 'abc' });
        validKey.should.equal('custom-abc');
      });

    });

    describe('.factory', () => {

      it('should be a function or a Factory instance', function() {
        modelRegistry.factory.should.satisfy(value => {
          return typeof value === 'function' || value instanceof Factory;
        });
      });

      it('can be set', function() {
        const setNewFactory = function() {
          const newFactory = new Factory(modelIdentities);
          modelRegistry.factory = newFactory;
        };
        setNewFactory.should.not.throw(Error);
      });

    });

    describe('.getModel(data, Constructor)', () => {

      it('should reuse existing registrations', function() {
        const registry = createRegistry({ allowOverrides: ALLOW_OVERRIDES });
        const model = new Model();
        registry.set(model.uuid, model);
        const fetched = registry.getModel(model.getDataReference());
        fetched.should.equal(model);
      });

      it('should create and register new models when key missing', function() {
        const registry = createRegistry();
        const data = { identity: Model.identity };
        expect(registry.has(data.uuid)).to.be.false;
        const created = registry.getModel(data);
        created.should.be.instanceof(Model);
        registry.has(created.uuid).should.be.true;
      });

      it('should respect explicit Constructor argument', function() {
        class CustomModel extends Model {
          _getDefaults() {
            return Object.assign(super._getDefaults(), { custom: true });
          }
        }
        const registry = createRegistry();
        const instance = registry.getModel({}, CustomModel);
        instance.should.be.instanceof(CustomModel);
        instance.get('custom').should.equal(true);
      });

    });

    describe('.newInstanceFor(data)', () => {

      it('should use mozy.Factory when provided', function() {
        const registry = createRegistry();
        const instance = registry.newInstanceFor({ identity: Model.identity });
        instance.should.be.instanceof(Model);
      });

      it('should use factory functions and throw when missing', function() {
        const registry = new Registry(function(data) {
          return new Model(data);
        });
        registry.newInstanceFor({ identity: Model.identity }).should.be.instanceof(Model);
        const createWithoutFactory = function() {
          const badRegistry = new Registry(() => {});
          badRegistry.factory = undefined;
          badRegistry.newInstanceFor({});
        };
        createWithoutFactory.should.throw();
      });

    });

    describe('.register(model) / .unregister(model)', () => {

      it('should register and unregister models by key', function() {
        const registry = createRegistry();
        const model = new Model();
        registry.register(model);
        registry.get(model.uuid).should.equal(model);
        registry.unregister(model).should.equal(true);
        expect(registry.get(model.uuid)).to.be.undefined;
      });

    });

    describe('.validate(key, value)', () => {

      it('should reject overriding keys when not allowed', function() {
        const registry = createRegistry();
        const model = new Model();
        registry.set(model.uuid, model);
        (() => registry.set(model.uuid, new Model())).should.throw(Error);
      });

      it('should allow overriding when option enabled', function() {
        const registry = createRegistry({ allowOverrides: ALLOW_OVERRIDES });
        const first = new Model();
        registry.set(first.uuid, first);
        const replacement = new Model();
        registry.set(first.uuid, replacement);
        registry.get(first.uuid).should.equal(replacement);
      });

      it('should ensure values are Model instances', function() {
        const registry = createRegistry();
        (() => registry.set('foo', {})).should.throw(TypeError);
      });

    });

    describe('.dataHasValidKey(data)', () => {

      it('should return false for invalid data', function() {
        const registry = createRegistry();
        registry.dataHasValidKey({}).should.equal(false);
        registry.dataHasValidKey({ uuid: 'abc' }).should.equal(true);
      });

    });

    describe('Map API helpers', () => {

      it('should proxy set/has/delete/clear', function() {
        const registry = createRegistry({ allowOverrides: ALLOW_OVERRIDES });
        const model = new Model();
        registry.set(model.uuid, model);
        registry.has(model.uuid).should.equal(true);
        registry.delete(model.uuid).should.equal(true);
        registry.has(model.uuid).should.equal(false);
        registry.set(model.uuid, model);
        registry.clear();
        registry.has(model.uuid).should.equal(false);
      });

    });

    describe('.dispose()', () => {

      it('should clear map and drop references', function() {
        const registry = createRegistry();
        registry.register(new Model());
        registry.dispose();
        expect(registry._map).to.be.undefined;
        expect(registry._factory).to.be.undefined;
      });

    });

    describe('Registry.get(name, ...args)', () => {

      it('should memoize registry instances per name', function() {
        const name = `test-registry-${Date.now()}`;
        const factory = new Factory(modelIdentities);
        const first = Registry.get(name, factory);
        const second = Registry.get(name, factory);
        first.should.equal(second);
        Registry._instances.delete(name);
      });

    });

  });

});
