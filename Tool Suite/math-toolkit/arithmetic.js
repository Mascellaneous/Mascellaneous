/**
 * Dependencies: None
 * Renders the Arithmetic tab content.
 */

function renderArithmetic() {
    const html = `
        <!-- Quick Operators -->
        <div class="tool-card">
            <h3>Quick Operators</h3>
            <p class="desc">Performs basic math and powers on two numbers simultaneously.</p>
            <div class="row">
                <div>
                    <label>Number A (Base)</label>
                    <input type="number" id="mathA" oninput="calcBasic()" placeholder="0">
                </div>
                <div>
                    <label>Number B (Exponent)</label>
                    <input type="number" id="mathB" oninput="calcBasic()" placeholder="0">
                </div>
            </div>
            <label>Results</label>
            <div class="result-box">
                <span>Sum (A+B): <span id="resSum">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('resSum').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Difference (A-B): <span id="resDiff">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('resDiff').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Product (A*B): <span id="resProd">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('resProd').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Quotient (A/B): <span id="resQuot">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('resQuot').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Power (A^B): <span id="resPow">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('resPow').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Arithmetic').innerHTML = html;
}

function calcBasic() {
    const a = parseFloat(document.getElementById('mathA').value) || 0;
    const b = parseFloat(document.getElementById('mathB').value) || 0;

    // Basic Math
    document.getElementById('resSum').innerText = a + b;
    document.getElementById('resDiff').innerText = a - b;
    document.getElementById('resProd').innerText = a * b;
    document.getElementById('resQuot').innerText = b !== 0 ? (a / b).toFixed(4) : "Undefined";
    
    // Power (A^B)
    document.getElementById('resPow').innerText = Math.pow(a, b);
}