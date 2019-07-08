/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import chai from 'chai';

import {
  Factory,
  Registry,
  modelIdentities,
  modelRegistry
} from '../src/index';

chai.should();

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

  });

});
