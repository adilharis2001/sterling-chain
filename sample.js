const chain = require('chain-sdk')

const client = new chain.Client()
const signer = new chain.HsmSigner()
const chai = require('chai')
const expect = chai.expect
let assetKey, accountKey

Promise.all([
  client.mockHsm.keys.create(),
  client.mockHsm.keys.create(),
]).then(keys => {
  assetKey = keys[0].xpub
  accountKey = keys[1].xpub

  signer.addKey(assetKey, client.mockHsm.signerConnection)
  signer.addKey(accountKey, client.mockHsm.signerConnection)
}).then(() =>
  // snippet list-local-assets
  client.assets.queryAll({
    filter: 'is_local=$1',
    filterParams: ['yes'],
  }, (asset, next) => {
    console.log('Local asset: ' + asset.alias)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-private-preferred-securities
  client.assets.queryAll({
    filter: 'definition.type=$1 AND definition.subtype=$2 AND definition.class=$3',
    filterParams: ['security', 'private', 'preferred'],
  }, (asset, next) => {
    console.log('Private preferred security: ' + asset.alias)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-issuances
  client.transactions.queryAll({
    filter: 'inputs(type=$1 AND asset_alias=$2)',
    filterParams: ['issue', 'acme_common'],
  }, (tx, next) => {
    console.log('Acme Common issued in tx ' + tx.id)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-transfers
  client.transactions.queryAll({
    filter: 'inputs(type=$1 AND asset_alias=$2)',
    filterParams: ['spend', 'acme_common'],
  }, (tx, next) => {
    console.log('Acme Common transferred in tx ' + tx.id)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-retirements
  client.transactions.queryAll({
    filter: 'outputs(type=$1 AND asset_alias=$2)',
    filterParams: ['retire', 'acme_common'],
  }, (tx, next) => {
    console.log('Acme Common retired in tx ' + tx.id)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-acme-common-balance
  client.balances.queryAll({
    filter: 'asset_alias=$1',
    filterParams: ['acme_common'],
  }, (balance, next) => {
    console.log('Total circulation of Acme Common: ' + balance.amount)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-acme-balance
  client.balances.queryAll({
    filter: 'asset_definition.issuer=$1',
    filterParams: ['Acme Inc.'],
  }, (balance, next) => {
    console.log('Total circulation of Acme stock ' + balance.sumBy.assetAlias + ': ' + balance.amount)
    next()
  })
  // endsnippet
).then(() =>
  // snippet list-acme-common-unspents
  client.unspentOutputs.queryAll({
    filter: 'asset_alias=$1',
    filterParams: ['acme_less_common'],
  }, (unspent, next, done) => {
    console.log('Acme Less Common held in output ' + unspent.id)
    next()
  }, (err) => {
    expect(err.message).to.equal('failure')
  })
  // endsnippet
).catch(err =>
  process.nextTick(() => { throw err })
)
