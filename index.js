var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var path = require('path');
const chain = require('chain-sdk')
const util = require('util')
const client = new chain.Client()
const signer = new chain.HsmSigner()

let genKey;
let xpub;
let _signer;
genKeyAsset = {"alias":null,"xpub":"0e938740587a08d722baca5018d3cb95bf09169176d0b09118c1e822f4be8d409c5a07a87069ef4d14759590dc8d07fcbe24777d02a047bfae0461fa1462972e"};
genKeyAccount = {"alias":null,"xpub":"b39e0bf8b61e027dc20c281d4b9b654b9cb3b4290715cb06f9b8a29801ccdb33c13423dcfcbe50dd1f1ebde60f45b1a91fb3bcd8f50c2c7f250992fb4cb2715e"};
xpubAsset = genKeyAsset.xpub;
xpubAccount = genKeyAccount.xpub;
signer.addKey(genKeyAsset.xpub, client.mockHsm.signerConnection);
signer.addKey(genKeyAccount.xpub, client.mockHsm.signerConnection);
// endsnippet
_signer = signer

// Initializing express and chain parameters
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.get('/index', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/createKey', function (req, res) {
  /*Promise.resolve().then(() => {
    // snippet create-key
    //genKey = client.mockHsm.keys.create()
    // endsnippet
    return genKey
  }).then(key => {
    xpub = genKey.xpub
    signer.addKey(key.xpub, client.mockHsm.signerConnection)
    // endsnippet
    _signer = signer
    res.send(key);*/
  //})
});

app.post('/createAsset', function (req, res) {
  var assetName = req.body.assetName;
  var createdAsset;
  Promise.resolve().then(() => {

    client.assets.create({
      alias: assetName,
      rootXpubs: [xpubAccount],
      quorum: 1,
      tags: {
        internalRating: '1',
      },
      definition: {
        issuer: 'Adil',
        type: 'Sample',
        subtype: 'private',
        class: 'common',
      },
    })

  })
});

app.post('/createAccount1', function (req, res) {
  var accountName = req.body.accountName;
  var createdAccount;
  Promise.resolve().then(() => {

  createdAccount = client.accounts.create({
      alias: accountName,
      rootXpubs: [xpubAccount],
      quorum: 1,
      tags: {
        type: 'Savings',
        first_name: accountName,
        last_name: 'Felicity',
        user_id: '2345',
      }
    })
    res.send(createdAccount);
  })
});

app.post('/createAccount2', function (req, res) {
  var accountName = req.body.accountName;
  var createdAccount;
  Promise.resolve().then(() => {

    createdAccount = client.accounts.create({
      alias: accountName,
      rootXpubs: [xpubAccount],
      quorum: 1,
      tags: {
        type: 'Savings',
        first_name: accountName,
        last_name: 'Velocity',
        user_id: '7568',
      }
    })
    res.send(createdAccount);

  })
});

app.post('/issueAssetToAccount', function (req, res) {
  const issuePromise = client.transactions.build(builder => {
    var accountName = req.body.accountName;
    var assetName = req.body.assetName;
    var qty = req.body.qty;
    //console.log(qty);
    builder.issue({
      assetAlias: assetName,
      amount: Number(qty)
    })
    builder.controlWithAccount({
      accountAlias: accountName,
      assetAlias: assetName,
      amount: Number(qty)
    })
  })
  // endsnippet
  return issuePromise.then(issueTx => {
  // snippet sign-issue
  const signingPromise = signer.sign(issueTx)
  // endsnippet
  return signingPromise
  }).then(signedIssueTx =>
  // snippet submit-issue
  client.transactions.submit(signedIssueTx)
  // endsnippet
  )

});

app.post('/getIssueTransactions', function (req, res) {
  var assetName = req.body.assetName;
  var listTransactions = '<ul>';
  client.transactions.queryAll({
    filter: 'inputs(type=$1 AND asset_alias=$2)',
    filterParams: ['issue', assetName],
  }, (tx, next) => {
    //console.log(util.inspect(tx, false, null))
    listTransactions += '<li>'+ assetName + ' issued with Transaction ID: ' + tx.id + ' <br>Timestamp: ' + tx.timestamp + ' <br>Account: ' + tx.outputs[0].accountAlias + ' <br>Amount: ' + tx.outputs[0].amount + '</li><br>';
    next()
    res.send(listTransactions + '</ul>');
  }).catch(err =>
    process.nextTick(() => { console.log(err) })
  )
});

//
app.post('/getTransferTransactions', function (req, res) {
  var assetName = req.body.assetName;
  var listTransactions = '<ul>';
  client.transactions.queryAll({
    filter: 'inputs(type=$1 AND asset_alias=$2)',
    filterParams: ['spend', assetName],
  }, (tx, next) => {
    console.log(util.inspect(tx, false, null))
    if (tx.outputs.length > 1) {
      listTransactions += '<li>'+ assetName + ' transferred with Transaction ID: ' + tx.id + ' <br>Timestamp: ' + tx.timestamp + ' <br>Sender Account: ' + tx.inputs[0].accountAlias + ' <br>Reciever Account: ' + tx.outputs[1].accountAlias + ' <br>Amount: ' + tx.outputs[1].amount + '</li><br>';
    }else{
      listTransactions += '<li>'+ assetName + ' transferred with Transaction ID: ' + tx.id + ' <br>Timestamp: ' + tx.timestamp + ' <br>Sender Account: ' + tx.inputs[0].accountAlias + ' <br>Reciever Account: ' + tx.outputs[0].accountAlias + ' <br>Amount: ' + tx.outputs[0].amount + '</li><br>';
    }
      next()
    res.send(listTransactions + '</ul>');
  })
});


app.post('/getAssetCirculation', function (req, res) {
  var assetName = req.body.assetName;
  var listTransactions = '<ul>';
  client.balances.queryAll({
    filter: 'asset_alias=$1',
    filterParams: [assetName],
  }, (balance, next) => {
  //  console.log('Total circulation of Acme Common: ' + balance.amount)
    console.log(util.inspect(balance, false, null))
    listTransactions += '<li>'+ 'Total circulation of ' + assetName + ': ' + balance.amount +'</li><br>';
    next()
    res.send(listTransactions + '</ul>');
  })
});

app.post('/getUnspentOutputs', function (req, res) {
  var assetName = req.body.assetName;
  var listTransactions = '<ul>';
  client.unspentOutputs.queryAll({
    filter: 'asset_alias=$1',
    filterParams: [assetName],
  }, (unspent, next) => {
  //  console.log(assetName + ' held in output ' + unspent.id)
    console.log(util.inspect(unspent, false, null))
    listTransactions += '<li>'+ 'Unspend output of ' + assetName + ': ' + unspent.id + ' <br>Amount: ' +unspent.amount+ ' <br>Account: '+unspent.accountAlias+'</li><br>';
    next()
    res.send(listTransactions + '</ul>');
  })
});


app.post('/transact', function (req, res) {
  const spendPromise = client.transactions.build(builder => {
    var senderAccount = req.body.senderAccount;
    var recieverAccount = req.body.recieverAccount;
    var transferQty = req.body.transferQty;
    var transferAsset = req.body.transferAsset;
    builder.spendFromAccount({
      accountAlias: senderAccount,
      assetAlias: transferAsset,
      amount: Number(transferQty)
    })
    builder.controlWithAccount({
      accountAlias: recieverAccount,
      assetAlias: transferAsset,
      amount: Number(transferQty)
    })
  })
  // endsnippet
  return spendPromise.then(spendTx => {
  // snippet sign-issue
  const signingPromise = signer.sign(spendTx)
  // endsnippet
  return signingPromise
}).then(signedSpendTx =>
  // snippet submit-issue
  client.transactions.submit(signedSpendTx)
  // endsnippet
  )

});


app.post('/getAccountBalances', function (req, res) {
  var accountName = req.body.accountName;
  var listTransactions = '<ul>';
  client.balances.queryAll({
    filter: 'account_alias=$1',
    filterParams: [accountName],
  }, (balance, next) => {
    console.log(util.inspect(balance, false, null))
    listTransactions += '<li>'+ 'Balance of ' + balance.amount + ' for Asset Name: ' + balance.sumBy.assetAlias + '</li><br>';
    //  console.log("Alice's balance of " + balance.sumBy.assetAlias + ': ' + balance.amount)
    next()
    res.send(listTransactions + '</ul>');
  })
});

app.post('/getAccountTransactions', function (req, res) {
  var accountName = req.body.accountName;
  var listTransactions = '<ul>';var counter = 0;
  client.transactions.queryAll({
    filter: 'inputs(account_alias=$1)',
    filterParams: [accountName],
  }, (tx, next) => {
    counter = counter + 1;
    //console.log(util.inspect(tx, false, null))
    if (tx.outputs.length > 1) {
      listTransactions += '<li>Transaction ID: ' + tx.id + ' <br>Timestamp: ' + tx.timestamp + ' <br>Sender Account: ' + tx.inputs[0].accountAlias + ' <br>Reciever Account: ' + tx.outputs[1].accountAlias + ' <br>Amount: ' + tx.outputs[1].amount + ' <br>Asset: ' + tx.outputs[1].assetAlias + '</li><br>';
    }else{
      listTransactions += '<li>Transaction ID: ' + tx.id + ' <br>Timestamp: ' + tx.timestamp + ' <br>Sender Account: ' + tx.inputs[0].accountAlias + ' <br>Reciever Account: ' + tx.outputs[0].accountAlias + ' <br>Amount: ' + tx.outputs[0].amount + ' <br>Asset: ' + tx.outputs[0].assetAlias + '</li><br>';
    }
    next()
  }, () => {
    if(counter == 0)
      res.send("<br>The entered account has not made any transaction or does not exist" + '</ul>');
    else
      var output = "<br>Displaying "+counter+" transactions<br>"+listTransactions;
      res.send(output);
  })
});


var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server Started %s:%s', host, port);
});
