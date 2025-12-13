import { 
    Lucid, 
    Blockfrost, 
    Data, 
    validatorToAddress, 
    getAddressDetails 
} from "@lucid-evolution/lucid";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

async function main() {
    console.log("-----------------------------------------");
    console.log("🚀 Starting Credential Publisher...");

    // 1. Initialize Lucid Evolution
    if (!process.env.BLOCKFROST_API_KEY) throw new Error("Missing BLOCKFROST_API_KEY in .env");
    
    const lucid = await Lucid(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", process.env.BLOCKFROST_API_KEY),
        "Preprod"
    );

    // 2. Load Wallet
    if (!process.env.SEED_PHRASE) throw new Error("Missing SEED_PHRASE in .env");
    
    lucid.selectWallet.fromSeed(process.env.SEED_PHRASE);
    const address = await lucid.wallet().address();
    console.log(`✅ Connected Wallet: ${address}`);

    // 3. Load Compiled Contract
    const buildFile = JSON.parse(readFileSync("./plutus.json", "utf-8"));
    const compiledCode = buildFile.validators[0].compiledCode;

    const validator = {
        type: "PlutusV2",
        script: compiledCode,
    };

    // --- FIX 1: Use standalone function with "Preprod" as first arg ---
    const scriptAddress = validatorToAddress("Preprod", validator);
    console.log(`📜 Contract Address: ${scriptAddress}`);

    // 4. Define Data Schema
    const MyCredentialSchema = Data.Object({
        doc_hash: Data.Bytes(), 
        issuer_id: Data.Bytes(), 
    });

    // --- FIX 2: Use standalone getAddressDetails ---
    const details = getAddressDetails(address);
    if (!details.paymentCredential) throw new Error("Could not get payment credential");

    // --- FIX 3: Pass the Schema as the second argument ---
    const myCredentialDatum = Data.to({
        doc_hash: "deadbeef", 
        issuer_id: details.paymentCredential.hash,
    }, MyCredentialSchema); 

    // 5. Build Transaction
    console.log("🔨 Building Transaction...");
    const tx = await lucid.newTx()
        .pay.ToContract(
            scriptAddress, 
            { kind: "inline", value: myCredentialDatum }, 
            { lovelace: 2000000n } 
        )
        .complete();

    // 6. Sign and Submit
    console.log("✍️  Signing...");
    const signedTx = await tx.sign.withWallet().complete();

    console.log("📤 Submitting...");
    const txHash = await signedTx.submit();

    console.log("\n🎉 SUCCESS!");
    console.log(`Tx Hash: ${txHash}`);
    console.log(`Explorer: https://preprod.cardanoscan.io/transaction/${txHash}`);
}

main().catch((e) => {
    console.error("❌ ERROR:", e);
});