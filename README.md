# DID Genrator Web Application

## Description
This web application gives users the ability to input their information about themselves or the organization they represent, and the website will use this information to return a generated DID document back to them in compliant did:web specification. The application will also generate a basic sigchain verifiable presentation for the user, and allows verification between a hosted did document and verifiable presentation.

### Technologies
- React
- Node.js
- Express

### Installation
1. Clone the repository
2. Navigate to the directory using ```cd did-generator```
3. This project uses node version 16, so ensure that you have nvm installed and run ```nvm use 16```
4. Run ```npm install``` to install all dependencies
5. In two separate terminals, navigate to src/client and src/server and run ```npm start``` in both terminals to start the server and client
6. Navigate to localhost:3000 in your browser to view the application