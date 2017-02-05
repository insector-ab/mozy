/* eslint-env mocha */
import uniq from 'lodash.uniq';
import uuidV4 from 'uuid/v4';
import chai from 'chai';
import validate from 'uuid-validate';
import {Model} from '../index';
import {Dimensions} from './layout';

chai.should();

describe('Model', () => {
    let dimensions;

    beforeEach(() => {
        // Create a new Dimensions instance before every test.
        dimensions = new Dimensions();
    });

    // Attribute: cid
    describe('.cid', () => {
        // Check type
        it('should be a string', function() {
            dimensions.cid.should.be.a('string');
        });
        // Check unique
        it('should be unique', function() {
            const model = new Model();
            const dim1 = new Dimensions();
            const dim2 = new Dimensions();
            const dim3 = new Dimensions();
            uniq([model.cid, dim1.cid, dim2.cid, dim3.cid]).should.have.length(4);
        });
        // No mutation
        it('can\'t be set', function() {
            const setCid = function() { dimensions.cid = 'aNewCid'; };
            setCid.should.throw(TypeError);
        });
    });

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
