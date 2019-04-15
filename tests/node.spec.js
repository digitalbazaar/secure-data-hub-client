import {DataHubClient} from '..';
import MockServer from './mockServer';
import {MockKmsService} from 'bedrock-web-mock-kms-http';
import {getMockKey} from './generateTestKey';

const config = {
  id: 'test'
};
const server = new MockServer();

describe('DataHubClient spec', function() {
  let hmac, kek, masterKey;
  before(async function() {
    const service = new MockKmsService({server});
    masterKey = await getMockKey({kmsService: service});
    hmac = await masterKey.generateKey({type: 'hmac'});
    kek = await masterKey.generateKey({type: 'kek'});
  });

  after(async function() {

  });

  it('should insert a document', async function() {
    const dataHub = new DataHubClient({config, hmac, kek});
    const doc = {id: 'foo', content: {someKey: 'someValue'}};
    /**
    const axiosCall = mockAxios
      .expects('post')
      .withArgs(dataHub.urls.document, sinon.match.object)
      .once()
      .returns({success: true});
    */
    const inserted = await dataHub.insert({doc});
    // axiosCall.verify();
    should.exist(inserted);
    inserted.should.be.an('object');
    inserted.id.should.equal('foo');
    inserted.sequence.should.equal(0);
    inserted.indexed.should.be.an('array');
    inserted.indexed.length.should.equal(1);
    inserted.indexed[0].should.be.an('object');
    inserted.indexed[0].sequence.should.equal(0);
    inserted.indexed[0].hmac.should.be.an('object');
    inserted.indexed[0].hmac.should.deep.equal({
      id: dataHub.indexHelper.hmac.id,
      algorithm: dataHub.indexHelper.hmac.algorithm
    });
    inserted.indexed[0].attributes.should.be.an('array');
    inserted.jwe.should.be.an('object');
    inserted.jwe.protected.should.be.a('string');
    inserted.jwe.recipients.should.be.an('array');
    inserted.jwe.recipients.length.should.equal(1);
    inserted.jwe.recipients[0].should.be.an('object');
    inserted.jwe.recipients[0].header.should.deep.equal({
      kid: dataHub.kek.id,
      alg: dataHub.kek.algorithm
    });
    inserted.jwe.iv.should.be.a('string');
    inserted.jwe.ciphertext.should.be.a('string');
    inserted.jwe.tag.should.be.a('string');
    inserted.content.should.deep.equal({someKey: 'someValue'});
  });
});
