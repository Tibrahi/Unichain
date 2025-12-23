// Function to update the persistent result display
function updatePersistentResult(data) {
    const resultSection = document.getElementById('persistent-result-section');
    const resultSummary = resultSection.querySelector('.result-summary');
    
    // Save to localStorage
    localStorage.setItem('lastVerificationResult', JSON.stringify(data));

    // Display the section
    resultSection.classList.remove('hidden');

    // Update Summary
    resultSummary.className = 'result-summary ' + data.status.toLowerCase();
    document.getElementById('result-status-icon').textContent = data.status === 'SUCCESS' ? '✅' : '❌';
    document.getElementById('result-status-text').textContent = data.summary;

    // Update Table
    document.getElementById('res-hash').textContent = data.hash.substring(0, 10) + '...' + data.hash.substring(data.hash.length - 10);
    document.getElementById('res-type').textContent = data.type;
    document.getElementById('res-issuer').textContent = data.issuer;
    document.getElementById('res-chain-status').textContent = data.chainStatus;
    document.getElementById('res-date').textContent = data.date;
}

// Function to load and display the last result from localStorage
function loadLastResult() {
    const storedData = localStorage.getItem('lastVerificationResult');
    if (storedData) {
        const data = JSON.parse(storedData);
        updatePersistentResult(data);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Load persistent result immediately
    loadLastResult(); 
    
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Deactivate all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate clicked tab
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // --- Sample Transaction Hash Click Logic ---
    const sampleLinks = document.querySelectorAll('.sample-tx-link');
    
    sampleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const txHash = link.getAttribute('data-hash');
            const targetInput = document.getElementById(targetId);
            
            if (targetInput) {
                targetInput.value = txHash;
                // Simple visual confirmation
                targetInput.style.transition = 'background-color 0.3s';
                targetInput.style.backgroundColor = '#005656'; // Dark Cyan flash
                setTimeout(() => {
                    targetInput.style.backgroundColor = '#333333';
                }, 300);
            }
        });
    });

    // --- Loan Agreement Checkbox Logic ---
    const loanCheckbox = document.getElementById('loan-agree');
    const loanVerifyBtn = document.getElementById('loan-verify-btn');

    if (loanCheckbox && loanVerifyBtn) {
        // Initial state
        loanVerifyBtn.disabled = !loanCheckbox.checked; 
        loanVerifyBtn.textContent = loanCheckbox.checked ? 'Verify Now' : 'Verify (Agree first)';

        loanCheckbox.addEventListener('change', () => {
            loanVerifyBtn.disabled = !loanCheckbox.checked;
            loanVerifyBtn.textContent = loanCheckbox.checked ? 'Verify Now' : 'Verify (Agree first)';
        });
    }

    // --- Verification Logic (with Persistence) ---
    const verifyButtons = document.querySelectorAll('.verify-btn');

    verifyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const verifyBlock = button.closest('.verify-block');
            const input = verifyBlock.querySelector('.tx-hash-input');
            const outputId = button.getAttribute('data-output');
            const output = document.getElementById(outputId);
            const currentTabId = button.closest('.tab-content').id;
            
            if (!input.value || input.value.length !== 64) {
                output.textContent = '❌ Invalid Hash. A Cardano Tx must be exactly 64 characters.';
                output.className = 'output-area error';
                // Clear persistence if there was an invalid attempt
                localStorage.removeItem('lastVerificationResult'); 
                document.getElementById('persistent-result-section').classList.add('hidden');
                return;
            }

            output.textContent = `⏳ Searching Cardano for Hash: ${input.value.substring(0, 10)}...`;
            output.className = 'output-area'; // Reset class

            // --- Simulate Verification Result and Update Persistence ---
            setTimeout(() => {
                const txHash = input.value;
                let resultData = {};
                
                if (txHash.startsWith('8ae88d7e')) { // Example Success
                    resultData = {
                        status: 'SUCCESS',
                        summary: 'Credential Authenticity CONFIRMED.',
                        hash: txHash,
                        type: 'Education Credential',
                        issuer: 'AUCA - African University of Central Africa',
                        chainStatus: 'Confirmed on Block 12,345,678',
                        date: new Date().toLocaleDateString('en-US')
                    };
                    output.textContent = `✅ Success! Authenticity Confirmed by ${resultData.issuer}.`;
                    output.className = 'output-area success';
                    
                } else if (txHash.startsWith('00000000')) { // Example Loan Status
                    resultData = {
                        status: 'SUCCESS',
                        summary: 'Loan Agreement Found and Status is ACTIVE.',
                        hash: txHash,
                        type: 'Loan Agreement',
                        issuer: 'Kigali SACCO',
                        chainStatus: 'Smart Contract Running',
                        date: new Date().toLocaleDateString('en-US')
                    };
                    output.textContent = `✅ Agreement Found. Status: ACTIVE. Issuer: ${resultData.issuer}.`;
                    output.className = 'output-area success';
                }
                else { // Example Failure/Error
                    resultData = {
                        status: 'ERROR',
                        summary: 'Hash FOUND, but Record is INVALID or TAMPERED.',
                        hash: txHash,
                        type: currentTabId.charAt(0).toUpperCase() + currentTabId.slice(1) + ' Verification',
                        issuer: 'Unknown/Invalid Issuer Signature',
                        chainStatus: 'Confirmed on Block 12,345,679',
                        date: new Date().toLocaleDateString('en-US')
                    };
                    output.textContent = `❌ ERROR: Hash Found on Chain, but the data integrity check FAILED. The record may be invalid or tampered with.`;
                    output.className = 'output-area error';
                }

                // Call the function to update the persistent result area
                updatePersistentResult(resultData);

            }, 2000); // 2 second delay for simulation
        });
    });
});