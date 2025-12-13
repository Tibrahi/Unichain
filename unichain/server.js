// server.js (Node.js backend)

import express from 'express';
import { readFileSync } from 'fs';
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// --- Load the compiled Plutus contract securely ---
let compiledCode;
try {
    const buildFile = JSON.parse(readFileSync("./plutus.json", "utf-8"));
    compiledCode = buildFile.validators[0].compiledCode;
    console.log("✅ Plutus contract loaded successfully.");
} catch (error) {
    console.error("❌ Failed to load plutus.json:", error.message);
    process.exit(1);
}

// --- Serve static files and API ---
app.use(express.static('public'));

app.get('/api/config', (req, res) => {
    res.json({
        compiledCode: compiledCode,
        network: "Preprod",
        blockfrostUrl: "https://cardano-preprod.blockfrost.io/api/v0",
    });
});

app.listen(PORT, () => {
    console.log(`\n============================================`);
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/index.html in your browser.`);
    console.log(`============================================\n`);
});