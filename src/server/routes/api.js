const express = require("express");
const router = express.Router();

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

function getKeypair() {
  const EC = require('elliptic').ec;
  const ec = new EC('secp256k1');
  const key = ec.genKeyPair();
  const publicKey = key.getPublic('hex');
  const privateKey = key.getPrivate('hex');
  return { publicKey, privateKey };
}

/* GET users listing. */
router.get("/users", function(req, res, next) {
  console.log('get "users" route hit');
  res.send({ users: ["joe", "bernie", "tulsi", "donald", "bill"] });
});

/* GET key pair */
router.get("/keypair", function (req, res, next) {
  console.log('get "keypair" route hit');
  const { publicKey, privateKey } = getKeypair();
  res.send({ keypair: [publicKey, privateKey] });
});


module.exports = router;
