/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {DataHubClient} from './DataHubClient.js';

export class DataHubDocument {
  /**
   * Creates a new instance of a DataHubDocument.
   *
   * @param {Object} options - The options to use.
   * @param {string} [options.id=undefined] the ID of the document; this is
   *   only necessary if the capability's `invocationTarget` is not for the
   *   document itself (but is for the entire data hub).
   * @param {Array} [recipients=[]] an array of additional recipients for the
   *   encrypted content.
   * @param {function} [keyResolver=this.keyResolver] a default function that
   *   returns a Promise that resolves a key ID to a DH public key.
   * @param {Object} [keyAgreementKey=null] a KeyAgreementKey API for deriving
   *   KEKs for wrapping/unwrapping content encryption keys.
   * @param {Object} [hmac=null] an HMAC API for blinding indexable
   *   attributes.
   * @param {Object} [options.capability=undefined] - The OCAP-LD authorization
   *   capability to use to authorize the invocation of DataHubClient methods.
   * @param {Object} options.invocationSigner - An API for signing
   *   a capability invocation.
   * @param {DataHubClient} [options.client] - An optional DataHubClient
   *   to use.
   *
   * @returns {DataHubDocument} The new DataHubDocument instance.
   */
  constructor({
    id, capability, invocationSigner,
    recipients = [], keyResolver = null,
    keyAgreementKey = null, hmac = null,
    // TODO: add `getKey`/`keyResolver`
    client = new DataHubClient()
  }) {
    this.id = id;
    this.recipients = recipients;
    this.keyResolver = keyResolver;
    this.keyAgreementKey = keyAgreementKey;
    this.hmac = hmac;
    this.capability = capability;
    if(!this.id) {
      // TODO: determine if there's a cleaner way to do this that maintains
      // portability
      this.id = _parseDataHubDocId(capability);
    }
    this.invocationSigner = invocationSigner;
    this.client = client;
  }

  /**
   * Retrieves and decrypts this document from its data hub.
   *
   * @returns {Promise<Object>} resolves to the decrypted document.
   */
  async read() {
    const {id, keyAgreementKey, capability, invocationSigner, client} = this;
    return client.get({id, keyAgreementKey, capability, invocationSigner});
  }

  /**
   * Encrypts and updates this document in its data hub.
   *
   * @param {Object} options - The options to use.
   * @param {Object} options.doc - The unencrypted document to update/insert.
   * @param {Array} [recipients=[]] an array of additional recipients for the
   *   encrypted content.
   * @param {function} keyResolver a function that returns a Promise
   *   that resolves a key ID to a DH public key.
   *
   * @returns {Promise<Object>} resolves to the inserted document.
   */
  async write(
    {doc, recipients = this.recipients, keyResolver = this.keyResolver}) {
    const {keyAgreementKey, hmac, capability, invocationSigner, client} = this;
    return client.update({
      doc, recipients, keyResolver,
      keyAgreementKey, hmac, capability, invocationSigner
    });
  }

  /**
   * Deletes this document from the data hub.
   *
   * @return {Promise<Boolean>} resolves to `true` if the document was deleted
   *   and `false` if it did not exist.
   */
  async delete() {
    const {id, capability, invocationSigner, client} = this;
    return client.delete({id, capability, invocationSigner});
  }
}

function _parseDataHubDocId(capability) {
  const target = DataHubClient._getInvocationTarget({capability});
  if(!target) {
    throw new TypeError('"capability" must be an object.');
  }
  let idx = target.lastIndexOf('/documents/');
  if(idx === -1) {
    // capability is not for a single document
    return;
  }
  idx += '/documents/'.length;
  return decodeURIComponent(target.substr(idx));
}