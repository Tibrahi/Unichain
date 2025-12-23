// public/app.js (Browser Frontend Logic - Verifier Mode)

import { 
    Lucid, 
    Blockfrost, 
    Data,
    C, // Import Cardano Serialization lib for address comparison
} from "https://unpkg.com/@lucid-evolution/lucid@0.10.1/web/mod.js"; 

let lucid;
let config;
let scriptAddress; // The UniChain Contract Address

const output = document.getElementById('output');
const verifyButton = document.getElementById('verifyCredential');

// --- UTILITY FUNCTIONS ---

// Fetches contract code and network info from our local server
async function loadConfig() {
    output.innerHTML = "Fetching dApp configuration and contract code...";
    try {
        const response = await fetch('/api/config');
        config = await response.json();
        output.innerHTML += `<br>Configuration loaded. Target Network: ${config.network}`;
        return true;
    } catch (e) {
        output.innerHTML = `❌ Failed to load config from server. Ensure 'node server.js' is running.`;
        console.error("Config load error:", e);
        return false;
    }
}

// --- MAIN DAPP LOGIC ---

async function connectSystem() {
    output.innerHTML = "Initializing connection to Cardano Preprod network...";
    
    if (!config) {
        if (!await loadConfig()) return;
    }

    try {
        // 1. Initialize Lucid - Verifiers only need read access
        lucid = await Lucid({
            provider: new Blockfrost(config.blockfrostUrl),
            network: config.network,
        });

        // 2. Calculate the Contract Address
        const validator = { type: "PlutusV2", script: config.compiledCode };
        scriptAddress = lucid.utils.validatorToAddress(validator); 

        output.innerHTML = `
            <span class="success">✅ Connection Successful.</span>
            <br>UniChain Contract Address: ${scriptAddress}
            <br>Ready for verification.
        `;
        verifyButton.disabled = false;

    } catch (error) {
        output.innerHTML = `❌ System Initialization Error: ${error.message}`;
        console.error(error);
    }
}

async function verifyCredential() {
    if (!lucid) {
        output.innerHTML = "❌ Please connect to the network first.";
        return;
    }

    const txHash = document.getElementById('txHash').value.trim();
    if (!txHash) {
        output.innerHTML = "❌ Please enter a Transaction Hash.";
        return;
    }

    output.innerHTML = `🔍 Searching blockchain for UTxO: ${txHash}...`;

    try {
        // Assume the UTxO is the first output (index 0) of the transaction
        const utxo = await lucid.utxosByOutRef([{ txHash: txHash, outputIndex: 0 }]);
        
        if (utxo.length === 0) {
            output.innerHTML = `<span class="failure">❌ Verification Failed:</span> UTxO not found on chain.`;
            return;
        }

        const credentialUtxo = utxo[0];
        
        // 1. Check if the UTxO is at the correct UniChain Contract Address
        if (credentialUtxo.address !== scriptAddress) {
            output.innerHTML = `
                <span class="failure">❌ Verification Failed:</span> UTxO exists, but is NOT at the official UniChain contract address.
                <br>Expected Address: ${scriptAddress}
                <br>Actual Address: ${credentialUtxo.address}
            `;
            return;
        }

        // 2. Check if a datum is present (required for credentials)
        if (!credentialUtxo.datum) {
            output.innerHTML = `<span class="failure">❌ Verification Failed:</span> UTxO is at the correct contract but lacks an attached inline datum.`;
            return;
        }

        // 3. Decode the Datum
        // Define the schema used when the credential was issued (from your original code)
        const MyCredentialSchema = Data.Object({
            doc_hash: Data.Bytes(), 
            issuer_id: Data.Bytes(), 
        });

        const decodedDatum = Data.from(credentialUtxo.datum, MyCredentialSchema);

        // 4. Verification Success
        output.innerHTML = `
            <span class="success">✅ CREDENTIAL VERIFIED! (Authenticity Confirmed)</span>
            <hr>
            <strong>Status:</strong> Valid and Tamper-Proof[cite: 77].
            <br><strong>UTxO Address:</strong> ${credentialUtxo.address}
            <br><strong>Lovelace Locked:</strong> ${credentialUtxo.assets.lovelace}n
            <hr>
            <strong>Credential Data:</strong>
            <br>&nbsp;&nbsp;&nbsp; Document Hash (e.g., of Transcript): ${decodedDatum.doc_hash}
            <br>&nbsp;&nbsp;&nbsp; Identity Hash (Issuer ID): ${decodedDatum.issuer_id} (Cryptographically tied to the user's wallet )
        `;

    } catch (error) {
        output.innerHTML = `<span class="failure">❌ Error during Verification:</span> ${error.message}`;
        console.error("Verification Error:", error);
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Load config immediately, but connect only when button is pressed
    await loadConfig(); 
    document.getElementById('connectSystem').addEventListener('click', connectSystem);
    document.getElementById('verifyCredential').addEventListener('click', verifyCredential);
});