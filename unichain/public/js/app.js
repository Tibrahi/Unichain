<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UniChain Verification Suite</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module" src="https://unpkg.com/lucid-cardano@0.10.7/web/mod.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Space Mono', monospace; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .blue-gradient { background: linear-gradient(135deg, #000000 0%, #003366 100%); }
    </style>
</head>
<body class="bg-black text-white min-h-screen">
    <nav class="border-b border-blue-900 p-4 bg-black sticky top-0 z-50">
        <div class="container mx-auto flex justify-between items-center">
            <div class="text-2xl font-bold text-blue-500 tracking-tighter">UniChain.rw</div>
            <div id="wallet-status" class="text-xs bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/50 text-blue-300">
                Mock Wallet: Disconnected
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <header class="text-center mb-12">
            <h1 class="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-500">
                Verification Suite
            </h1>
            <p class="text-gray-400 max-w-2xl mx-auto">Instantly verify tamper-proof credentials, loans, and identities on the Cardano blockchain for Rwanda.</p>
        </header>

        <div class="flex flex-wrap justify-center gap-2 mb-8 bg-gray-900/50 p-2 rounded-xl border border-gray-800">
            <button class="tab-btn active px-6 py-2 rounded-lg transition-all bg-blue-600 text-white" data-tab="education">🎓 Education</button>
            <button class="tab-btn px-6 py-2 rounded-lg transition-all hover:bg-gray-800" data-tab="loan">💰 Loan</button>
            <button class="tab-btn px-6 py-2 rounded-lg transition-all hover:bg-gray-800" data-tab="identity">🆔 Identity</button>
            <button class="tab-btn px-6 py-2 rounded-lg transition-all hover:bg-gray-800" data-tab="general">🔗 General</button>
        </div>

        <main class="grid gap-8">
            <section id="education" class="tab-content active animate-fadeIn">
                <div class="grid md:grid-cols-2 gap-8 bg-gray-900/30 p-8 rounded-2xl border border-blue-900/30">
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-blue-400">How It Works: Credentials</h2>
                        <p class="text-sm text-gray-300">Universities issue signed hashes to the Cardano ledger using <strong>Aiken-compiled</strong> validators.</p>
                        <div class="p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded-r">
                            <p class="text-xs italic text-blue-200">✅ Eliminates fake degrees. Instant, global verification.</p>
                        </div>
                    </div>
                    <div class="bg-black p-6 rounded-xl border border-gray-800 shadow-2xl">
                        <h2 class="text-lg font-bold mb-4">Verify Education Hash</h2>
                        <input type="text" id="tx-education" class="w-full bg-gray-900 border border-gray-700 p-3 rounded mb-4 text-xs font-mono focus:border-blue-500 outline-none" placeholder="Cardano Tx Hash (64 chars)" />
                        <button class="verify-btn w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition-all" data-type="Education" data-input="tx-education">Verify via Plutus</button>
                    </div>
                </div>
            </section>

            <section id="loan" class="tab-content">
                <div class="grid md:grid-cols-2 gap-8 bg-gray-900/30 p-8 rounded-2xl border border-blue-900/30">
                    <div class="bg-black p-6 rounded-xl border border-gray-800">
                        <h2 class="text-lg font-bold mb-4 text-blue-400">Verify Loan Status</h2>
                        <input type="text" id="tx-loan" class="w-full bg-gray-900 border border-gray-700 p-3 rounded mb-4 text-xs font-mono" placeholder="Loan Contract Reference" />
                        <div class="flex items-start mb-4 gap-2">
                            <input type="checkbox" id="loan-agree" class="mt-1">
                            <label for="loan-agree" class="text-[10px] text-gray-400">I understand this tool verifies cryptographic integrity of the Plutus datum, not legal advice.</label>
                        </div>
                        <button id="loan-verify-btn" disabled class="verify-btn w-full bg-gray-700 cursor-not-allowed py-3 rounded-lg font-bold" data-type="Loan" data-input="tx-loan">Verify Agreement</button>
                    </div>
                    <div class="space-y-4">
                        <h2 class="text-2xl font-bold text-white">Loan Logic</h2>
                        <p class="text-sm text-gray-400">Validates the on-chain status (active/paid) using <strong>Plutus V2</strong> scripts.</p>
                    </div>
                </div>
            </section>

            <section id="persistent-result-section" class="hidden mt-8 animate-bounce-in">
                <div class="bg-white text-black p-8 rounded-2xl shadow-[0_0_50px_rgba(30,64,175,0.3)]">
                    <h2 class="text-2xl font-bold mb-6 border-b-2 border-black pb-2">🧾 Verification Certificate</h2>
                    <table class="w-full text-sm">
                        <tr class="border-b border-gray-200"><th class="text-left py-3">Result</th> <td id="res-status" class="font-bold text-blue-600">VALIDATED</td></tr>
                        <tr class="border-b border-gray-200"><th class="text-left py-3">Hash</th> <td id="res-hash" class="font-mono break-all text-[10px]"></td></tr>
                        <tr class="border-b border-gray-200"><th class="text-left py-3">Logic Type</th> <td id="res-type"></td></tr>
                        <tr class="border-b border-gray-200"><th class="text-left py-3">Network</th> <td id="res-chain-status">Cardano Preprod (Simulated)</td></tr>
                    </table>
                </div>
            </section>
        </main>

        <footer class="mt-20 py-8 border-t border-gray-800 text-center text-gray-500 text-xs">
            UniChain: Rwanda's Unified Trust Infrastructure (2025). Built with Aiken & Lucid.
        </footer>
    </div>

    <script type="module" src="script.js"></script>
</body>
</html>