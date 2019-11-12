/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import uuidV4 from 'uuid/v4';
import chai from 'chai';
import validate from 'uuid-validate';

import { Model } from '../src/index';
import {
  Dimensions,
  Rect
} from './layout';

chai.should();

describe('Model', () => {
  let dimensions;

  beforeEach(() => {
    // Create a new Dimensions instance before every test.
    dimensions = new Dimensions();
  });

  // Use cases
  describe('Use cases', () => {
    // Write
  });

  // Interface
  describe('Interface', () => {

    // Constructor
    describe('constructor(data = {}, ...args)', () => {

      it('should create a Model instance', function() {
        // Model
        const model = new Model();
        model.getModelData().should.satisfy(value => {
          return value.identity === Model.identity &&
                 validate(value.uuid, 4);
        });
        // Model subclass
        dimensions.getModelData().should.satisfy(value => {
          return value.identity === Dimensions.identity &&
                 validate(value.uuid, 4);
        });
      });

      it('should handle data argument', function() {
        // Set model value
        dimensions.contentBox.width = 100;
        // dimensions data
        const data = dimensions.getModelData();
        // New Dimensions instance
        const newDim = new Dimensions(data);
        // model getter
        newDim.contentBox.width.should.equal(100);
        // model data
        newDim.getModelData().should.satisfy(value => {
          return value.identity === Dimensions.identity &&
                 validate(value.uuid, 4) &&
                 value.contentBox.width === 100;
        });
      });

    });

    // Attribute: uuid
    describe('.uuid', () => {

      it('should be a string', function() {
        dimensions.uuid.should.be.a('string');
      });

      it('should be UUID format version 4', function() {
        validate(dimensions.uuid, 4).should.be.true;
      });

      it('can\'t be set', function() {
        const setUuid = function() { dimensions.uuid = uuidV4(); };
        setUuid.should.throw(TypeError);
      });

    });

    // Method: getModelIdentity
    describe('.getModelIdentity()', () => {

      it('should be a string', function() {
        (new Model()).getModelIdentity().should.be.a('string');
        dimensions.getModelIdentity().should.be.a('string');
      });

    });

    // Method: getModelData
    describe('.getModelData()', () => {

      it('should be an object', function() {
        (new Model()).getModelData().should.be.a('object');
        dimensions.getModelData().should.be.a('object');
      });

      it('should not be the underlying data reference', function() {
        dimensions.getModelData().should.not.equal(dimensions.getDataReference());
      });

    });

    // Method: getDataReference
    describe('.getDataReference()', () => {

      it('should be an object', function() {
        (new Model()).getDataReference().should.be.a('object');
        dimensions.getDataReference().should.be.a('object');
      });

      it('should be the underlying data reference', function() {
        dimensions.getDataReference().should.equal(dimensions._data);
      });

    });

    // Method: copy
    describe('.copy()', () => {
      // Create a new Rect instance before every test.
      const box = new Rect();
      // Create new Dimensions instances before every test.
      const dim1 = new Dimensions({ contentBox: box.getDataReference() });
      dim1.margin.left = 100;
      const dim2 = new Dimensions({ contentBox: box.getDataReference() });
      dim2.padding.top = 50;
      // Model
      const model = new Model({
        dim1: dim1.getDataReference(),
        dim2: dim2.getDataReference(),
        someUuidReference: uuidV4()
      });
      // Copy
      const copiedModel = model.copy();
      // New instances of Dimensions with copied data
      const newDim1 = new Dimensions(copiedModel.get('dim1'));
      const newDim2 = new Dimensions(copiedModel.get('dim2'));

      it('should properly copy model properties', function() {
        // Margin value should be the same
        dim1.margin.left.should.equal(newDim1.margin.left);
        // Padding value should be the same
        dim2.padding.top.should.equal(newDim2.padding.top);
      });

      it('should replace multiple instances of an uuid with the same new uuid', function() {
        // contentBox uuids should be the same
        newDim1.contentBox.uuid.should.equal(newDim2.contentBox.uuid);
      });

      it('should preserve uuid references (key !== "uuid")', function() {
        model.get('someUuidReference').should.equal(copiedModel.get('someUuidReference'));
      });

    });

  });

});
