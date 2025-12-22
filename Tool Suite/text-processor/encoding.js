/**
 * Dependencies: None
 * Contains functions for Base64, URL encoding, and ROT13.
 * Renders the Encoding tab content.
 */

function renderEncoding() {
    const html = `
        <!-- Base64 Encoder/Decoder -->
        <div class="tool-card">
            <h3>Base64 Converter</h3>
            <p class="desc">Encodes text to Base64 or decodes Base64 strings.</p>
            <label>Input Text</label>
            <textarea id="base64Input" placeholder="Type here..."></textarea>
            <div class="row" style="margin-bottom: 10px;">
                <button onclick="convertBase64('encode')" style="padding:5px 10px;">Encode</button>
                <button onclick="convertBase64('decode')" style="padding:5px 10px;">Decode</button>
            </div>
            <label>Result</label>
            <div class="result-box multi-line">
                <textarea id="base64Result" readonly></textarea>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('base64Result').value, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- URL Encoder/Decoder -->
        <div class="tool-card">
            <h3>URL Encoder/Decoder</h3>
            <p class="desc">Converts characters into a format that can be transmitted over the Internet.</p>
            <label>Input Text</label>
            <textarea id="urlInput" placeholder="Type here..."></textarea>
            <div class="row" style="margin-bottom: 10px;">
                <button onclick="convertURL('encode')" style="padding:5px 10px;">Encode</button>
                <button onclick="convertURL('decode')" style="padding:5px 10px;">Decode</button>
            </div>
            <label>Result</label>
            <div class="result-box multi-line">
                <textarea id="urlResult" readonly></textarea>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('urlResult').value, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Encoding').innerHTML = html;
}

// Base64 Logic
function convertBase64(action) {
    const input = document.getElementById('base64Input').value;
    const output = document.getElementById('base64Result');
    
    try {
        if (action === 'encode') {
            output.value = btoa(input);
        } else {
            output.value = atob(input);
        }
    } catch (e) {
        output.value = "Error: Invalid input for operation.";
    }
}

// URL Encode Logic
function convertURL(action) {
    const input = document.getElementById('urlInput').value;
    const output = document.getElementById('urlResult');
    
    try {
        if (action === 'encode') {
            output.value = encodeURIComponent(input);
        } else {
            output.value = decodeURIComponent(input);
        }
    } catch (e) {
        output.value = "Error: Could not decode URI.";
    }
}