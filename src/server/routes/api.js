const express = require("express");
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
const elliptic = require('elliptic');

const KEY_JSON_PATH = './src/server/key.json';
const DID_METHOD = 'did:web:';
const DID_TEMPLATE = {
  "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "",
  "subjectType": "",
  "subjectName": "",
  "verificationMethod": [

  ],
  "assertionMethod": [
  ]
}
const VERIFICATION_METHOD_TEMPLATE = {
  "id": "",
  "type": "JsonWebKey2020",
  "controller": "",
  "publicKeyJwk": {
      "kty": "EC",
      "crv": "secp256k1",
      "x": "replace-this",
      "y": "replace-this"
  }
}


function storeData(data, path) {
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    console.error(err)
  }
}

function loadData(path) {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch (err) {
    console.error(err)
    return false
  }
}

function generateKeypair() {
  const size = parseInt(process.argv.slice(2)[0]) || 32;
  const key = crypto.randomBytes(size).toString("hex");
  const ec = new elliptic.ec('secp256k1');
  const prv = ec.keyFromPrivate(key, 'hex');
  const pub = prv.getPublic();
  const pubX = pub.x.toBuffer().toString('base64');
  const pubY = pub.y.toBuffer().toString('base64');
  console.log('pub: ' + pubX);
  return [pub, prv, pubX, pubY];
}

function getKeypair() {
  // TODO: use a json file to store the keypair
  const keypair = generateKeypair();
  return keypair;
}

function createVerificationMethod(url, pubX, pubY) {
  const didController = DID_METHOD + url;
  const verificationMethodId = didController + "#keys-1";
  const verificationMethod = VERIFICATION_METHOD_TEMPLATE;
  verificationMethod['id'] = verificationMethodId;
  verificationMethod['controller'] = didController;
  verificationMethod['publicKeyJwk']['x'] = pubX;
  verificationMethod['publicKeyJwk']['y'] = pubY;
  return verificationMethod;
}
function createDID(url, subjectType, subjectName, pubX, pubY) {
  const didController = DID_METHOD + url;
  const verificationMethodId = didController + "#keys-1";
  const verificationMethod = createVerificationMethod(url, pubX, pubY);

  const did = DID_TEMPLATE;
  did['id'] = didController;
  did['subjectType'] = subjectType;
  did['subjectName'] = subjectName;
  did['verificationMethod'] = verificationMethod;
  did['assertionMethod'] = verificationMethodId;
  
  return did;
}


/* GET users listing. */
router.get("/users", function (req, res, next) {
  console.log('get "users" route hit');
  res.send({ users: ["joe", "bernie", "tulsi", "donald", "bill"] });
});

/* GET key pair */
router.get("/keypair", function (req, res, next) {
  console.log('get "keypair" route hit');
  const keypair = getKeypair();
  res.send({ keypair: keypair });
});

/* POST DID */
router.post("/did", function (req, res, next) {
  console.log('post "did" route hit');
  const body = req.body;
  const url = body.url;
  const subjectType = body.subjectType;
  const subjectName = body.subjectName;
  const pubX = body.pubX;
  const pubY = body.pubY;
  
  const did = createDID(url, subjectType, subjectName, pubX, pubY);

  res.send({ did: did });
});


module.exports = router;
