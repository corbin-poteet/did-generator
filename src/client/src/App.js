import maoi from './maoi.jpeg';
import sound from './did.mp3';
import './App.css';
import React, { useState } from 'react';
import useSound from 'use-sound';
import { id } from 'ethers/lib/utils';

const KEY_JSON_PATH = "testData.json";



// inputs: url, subject type, subject name
// subject type: person, organization, etc
// subject name: if person then first/last, if org then org name

const didMethod = "did:web:"
//DUE TO: replace with user input
const didUrl = "srujn.github.io:did-root"
const didController = didMethod + didUrl



const vmCount = 1

const vmTemplate = {
  "id": didController, //add key identifier
  "type": "JsonWebKey2020",
  "controller": didController,
  "publicKeyJwk": {
    "kty": "EC",
    "crv": "secp256k1",
    "x": "replace-this",
    "y": "replace-this"
  }
}

const didTemplate = {
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": didController,
  "verificationMethod": [

  ],
  "assertionMethod": [
  ]
}

// const [users, setUsers] = useState([]);

// useEffect(() => {
//   fetch("/api/users")
//     .then(res => res.json())
//     .then(json => setUsers(json.users));
//   // Specify how to clean up after this effect:
//   return () => {};
// }, []); // empty 2nd arg - only runs once

async function submit(url, isOrg, orgName, firstName, lastName) {
  // print url, isOrg, orgName, firstName, lastName
  console.log("URL: " + url + "\n" + "isOrg: "
    + isOrg + "\n" + "orgName: " + orgName + "\n"
    + "firstName: " + firstName + "\n" + "lastName: "
    + lastName + "\n");
  
  // generate keypair
  const keypair = await getKeypair();
  console.log(keypair);
  const pubX = keypair[2];
  const pubY = keypair[3];
  console.log(pubX);
  console.log(pubY);

  // generate DID
  const subjectType = isOrg ? "organization" : "person";
  const subjectName = isOrg ? orgName : firstName + " " + lastName;
  const did = await getDID(url, subjectType, subjectName, pubX, pubY);
  console.log(JSON.stringify(did, null, 2));
  
  

}

async function getKeypair() {
  return fetch("/api/keypair", {
    headers : { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
     }
  })
    .then(res => res.json())
    .then(json => {
      return json.keypair;
    });
}

async function getDID(url, subjectType, subjectName, pubX, pubY) {
  return fetch("/api/did", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: url,
      subjectType: subjectType,
      subjectName: subjectName,
      pubX: pubX,
      pubY: pubY
    })
  })
    .then(res => res.json())
    .then(json => {
      return json.did;
    });
}


// Functions for validating the did document and vp pair
//========================================================
// 1. Fetch the did document from a hosted location
async function fetchHostedDID(url) {
  return fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2)); // Prints the did doc to the console
  })
  .catch(error => console.error('An error occurred while fetching the did document from '+url+": ", error));
}

// 2. Fetch the vp from a hosted location
async function fetchHostedVP(url) {
  return fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2)); // Prints the vp to the console
  })
  .catch(error => console.error('An error occurred while fetching the vp from '+url+": ", error));
}

// 3. Validate the did document and vp pair
async function validateDidVp(vpUrl, didUrl) {
  let vp = fetchHostedVP(vpUrl);
  let did = fetchHostedDID(didUrl);
  console.log("Yep, you just did that");
  console.log(vp[id]);

  return true; //placeholder
}
//========================================================


// App component
function App() {
  const [play] = useSound(sound);

  const [url, setUrl] = useState("joe.com");

  const [isOrg, setIsOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [firstName, setFirstName] = useState("joe");
  const [lastName, setLastName] = useState("brandon");

  const [vpUrl, setVpUrl] = useState("https://aus36.github.io/didweb-doc/vp.json"); // Url for hosted vp
  const [didUrl, setDidUrl] = useState("https://aus36.github.io/didweb-doc/did.json"); // Url for hosted did document

  const [loaded, setLoaded] = useState(false); // flag for when the validate pair function has been called

  const [validateSuccessful, setValidateSuccessful] = useState(false); // flag for the result when the validate pair function has been called

  const setType = () => {
    if (document.getElementById('type').value === 'organization') {
      setIsOrg(true);
    } else {
      setIsOrg(false);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {<img src={maoi} onClick={play} className="App-logo" alt="logo" />}
        <form style={{ textAlign: 'left', width: '50%', margin: 'auto' }}
          onSubmit={e => {
            e.preventDefault();
            submit(url, isOrg, orgName, firstName, lastName);
          }}>
          <label>
            URL:
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} />
          </label>
          <br />
          <label>
            Subject Type:
            <select id='type' onChange={setType}>
              <option value="person">Person</option>
              <option value="organization">Organization</option>
            </select>
          </label>
          <br />
          {isOrg ?
            <label>
              Organization Name:
              <input type="text" onChange={e => setOrgName(e.target.value)} />
            </label> :
            <label>
              First Name:
              <input id="firstName" value={firstName} type="text" onChange={e => setFirstName(e.target.value)} />
              <br />
              Last Name:
              <input id="lastName" value={lastName} type="text" onChange={e => setLastName(e.target.value)} />
            </label>
          }
          <br />
          <input type="submit" value="Submit" />
        </form>
        <br />
        <form>
          <label>
            DID Document URL:
            <input id="didDocUrl" value={didUrl} type="text" onChange={e => setDidUrl(e.target.value)} />
            <br />
            Verifiable Presentation URL:
            <input id="vpUrl" value={vpUrl} type="text" onChange={e => setVpUrl(e.target.value)} />
          </label>
        </form>
        <br />
        <button onClick={ () => {setValidateSuccessful(validateDidVp(vpUrl, didUrl)); setLoaded(true);}}>Validate did document and vp pair</button>
        <br />
        {loaded
        ? <p>Validation result: {validateSuccessful ? "Pair Sucessfully Validated" : "Invalid DID Doc/VP Pair"}</p> 
        : <p>Nothing to validate yet</p>}
      </header>
    </div>
  );
}

export default App;