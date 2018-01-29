/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import uuidV4 from 'uuid/v4';
import chai from 'chai';
import validate from 'uuid-validate';
import {Dimensions} from './layout';

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
    // Attribute: uuid
    describe('.uuid', () => {
      // Check type
      it('should be a string', function() {
        dimensions.uuid.should.be.a('string');
      });
      // Check correct format
      it('should be UUID format version 4', function() {
        validate(dimensions.uuid, 4).should.be.true;
      });
      // No mutation
      it('can\'t be set', function() {
        const setUuid = function() { dimensions.uuid = uuidV4(); };
        setUuid.should.throw(TypeError);
      });
    });

  });

});
