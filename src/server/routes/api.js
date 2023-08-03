const express = require("express");
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
const elliptic = require('elliptic');
const { ES256KSigner, hexToBytes } = require('did-jwt');
//import { ES256KSigner, hexToBytes } from "did-jwt";

// constants
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
const VERIFIABLE_CREDENTIAL_TEMPLATE = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  "id": "",
  "type": [
    "VerifiableCredential"
  ],
  "issuer": {
    "id": "",
    "signer": ""
  },
  "issuanceDate": "",
  "expirationDate": "",
  "credentialSubject": {
    "id": "",
    "type": [
      ""
    ]
  },
  "sigchainData": {
    "prev": "",
    "seqno": -1,
    "tag": "signature"
  },
  "credentialStatus": {
    "id": "",
    "type": "CredentialStatusList2017"
  },
  "proof": {
    "type": "",
    "created": "",
    "verificationMethod": "",
    "proofPurpose": "assertionMethod",
    "proofValue": ""
  }
}
const VERIFIABLE_PRESENTATION_TEMPLATE = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  "id": "",
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredentials": []
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

function convertDateTimeToSevenPropertyFormat(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

function generateKeypair() {
  const size = parseInt(process.argv.slice(2)[0]) || 32;
  const key = crypto.randomBytes(size).toString("hex");
  const ec = new elliptic.ec('secp256k1');
  const prv = ec.keyFromPrivate(key, 'hex');
  const pub = prv.getPublic();
  const pubX = pub.x.toBuffer().toString('base64');
  const pubY = pub.y.toBuffer().toString('base64');
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
  did['verificationMethod'][0] = verificationMethod;
  did['assertionMethod'] = verificationMethodId;
  
  return did;
}

function createVerifiableCredential(key, did, type) {
  const verifiableCredential = { ...VERIFIABLE_CREDENTIAL_TEMPLATE };
  console.log("CREATING VERIFIABLE CREDENTIAL")
  console.log(verifiableCredential);

  // id
  // issuer
  const issuer = {};
    // id
  const issuerId = did['id'];
  issuer['id'] = issuerId;
    // signer
    // TODO: find a way around this not working
    //const issuerSigner = ES256KSigner(hexToBytes(key));
    //issuer['signer'] = issuerSigner;
  verifiableCredential['issuer'] = issuer;

  // issuanceDate
  const issuanceDate = convertDateTimeToSevenPropertyFormat(new Date());
  verifiableCredential['issuanceDate'] = issuanceDate;
  // expirationDate
  const expirationDate = convertDateTimeToSevenPropertyFormat(new Date());
  verifiableCredential['expirationDate'] = expirationDate;
  // credentialSubject
  const credentialSubject = {};
    // id
  const credentialSubjectId = did['id'];
  credentialSubject['id'] = credentialSubjectId;  
    // type
  const credentialSubjectType = type;
  credentialSubject['type'] = credentialSubjectType;
  switch (type) {
    case "web_service_binding":
      console.log("creating web_service_binding");
      const service = {};
      const serviceName = "github";
      const serviceUsername = "exampleStudent";
      const serviceProof = "https://github.com/exampleStudent/asdfsgre...";
      service['name'] = serviceName;
      service['username'] = serviceUsername;
      service['proof'] = serviceProof;
      credentialSubject['service'] = service;
      break;
    case "revoke":
      console.log("creating revoke");
      const revoke = {};
      const seqnos = [1, 2, 3];
      revoke['seqnos'] = seqnos;
      credentialSubject['revoke'] = revoke;
      break;
    default:
      break;
  }

  verifiableCredential['credentialSubject'] = credentialSubject;
  
  // credentialStatus
  const credentialStatus = {};
    // id - link to the issuer's credential status registry
    // type
  const credentialStatusType = "CredentialStatusList2017";
  credentialStatus['type'] = credentialStatusType;
  verifiableCredential['credentialStatus'] = credentialStatus;
  
  // proof
  const proof = {};
    // type
  const proofType = "Ed25519Signature2020";
  proof['type'] = proofType;
    // created
  const proofCreated = convertDateTimeToSevenPropertyFormat(new Date());
  proof['created'] = proofCreated;
    // verificationMethod
  const proofVerificationMethod = did['verificationMethod'][0]['id'];
  proof['verificationMethod'] = proofVerificationMethod;
    // proofValue
  const proofValue = "";
  proof['proofValue'] = proofValue;
  return { ...verifiableCredential };
}

function addCredentialToPresentation(verifiablePresentation, verifiableCredential) {
  console.log("adding credential to presentation");

  const numOfCredentials = verifiablePresentation['verifiableCredentials'].length;
  const type = verifiableCredential['credentialSubject']['type'];
  console.log("numOfCredentials: " + numOfCredentials);
  console.log("type: " + type);
  if (numOfCredentials == 0) {
    if (type != "eldest") {
      //console.error("first credential must be of type 'eldest'");
      //return;
    }
  }

  //console.log(verifiablePresentation)
  verifiableCredential['sigchainData']['seqno'] = numOfCredentials;
  console.log("verifiableCredentialNumThing: " + verifiableCredential['sigchainData']['seqno']);

  verifiablePresentation['verifiableCredentials'].push({ ...verifiableCredential });

}

function createVerifiablePresentation(key, did) {
  const verifiablePresentation = { ...VERIFIABLE_PRESENTATION_TEMPLATE };
  // id
  const id = did['id'];
  verifiablePresentation['id'] = id;
  // verifiableCredentials
  const vc_eldest = createVerifiableCredential(key, did, "eldest");
  const vc_web_service_binding = createVerifiableCredential(key, did, "web_service_binding");
  const vc_revoke = createVerifiableCredential(key, did, "revoke");

  addCredentialToPresentation(verifiablePresentation, vc_eldest);
  addCredentialToPresentation(verifiablePresentation, vc_web_service_binding);
  addCredentialToPresentation(verifiablePresentation, vc_revoke);




  return verifiablePresentation;
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

/* POST verifiable credential */
router.post("/vc", function (req, res, next) {
  console.log('post "vc" route hit');
  const body = req.body;
  const key = body.key;
  const did = body.did;
  const type = body.type;

  const vc = createVerifiableCredential(key, did, type);

  res.send({ vc: vc });
});

router.post("/vp", function (req, res, next) {
  console.log('post "vp" route hit');
  const body = req.body;
  const key = body.key;
  const did = body.did;

  const vp = createVerifiablePresentation(key, did);

  res.send({ vp: vp });
});


module.exports = router;
