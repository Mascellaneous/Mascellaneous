/**
 * Dependencies: None
 * Renders the Arithmetic tab content.
 */

function renderArithmetic() {
    const html = `
        <!-- Quick Operators -->
        <div class="tool-card">
            <h3>Quick Operators</h3>
            <p class="desc">Performs basic math on two numbers simultaneously.</p>
            <div class="row">
                <div>
                    <label>Number A</label>
                    <input type="number" id="mathA" oninput="calcBasic()" placeholder="0">
                </div>
                <div>
                    <label>Number B</label>
                    <input type="number" id="mathB" oninput="calcBasic()" placeholder="0">
                </div>
            </div>
            <label>Results</label>
            <div class="result-box"><span>Sum (A+B): <span id="resSum">-</span></span></div>
            <div class="result-box" style="margin-top:5px"><span>Difference (A-B): <span id="resDiff">-</span></span></div>
            <div class="result-box" style="margin-top:5px"><span>Product (A*B): <span id="resProd">-</span></span></div>
            <div class="result-box" style="margin-top:5px"><span>Quotient (A/B): <span id="resQuot">-</span></span></div>
        </div>

        <!-- Power & Root -->
        <div class="tool-card">
            <h3>Powers</h3>
            <p class="desc">Calculates A to the power of B.</p>
            <div class="row">
                <div>
                    <label>Base</label>
                    <input type="number" id="powBase" oninput="calcPower()" placeholder="Base">
                </div>
                <div>
                    <label>Exponent</label>
                    <input type="number" id="powExp" oninput="calcPower()" placeholder="Exp">
                </div>
            </div>
            <div class="result-box">
                <span>Result: <span id="resPower">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('resPower').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Arithmetic').innerHTML = html;
}

function calcBasic() {
    const a = parseFloat(document.getElementById('mathA').value) || 0;
    const b = parseFloat(document.getElementById('mathB').value) || 0;

    document.getElementById('resSum').innerText = a + b;
    document.getElementById('resDiff').innerText = a - b;
    document.getElementById('resProd').innerText = a * b;
    document.getElementById('resQuot').innerText = b !== 0 ? (a / b).toFixed(4) : "Undefined";
}

function calcPower() {
    const b = parseFloat(document.getElementById('powBase').value);
    const e = parseFloat(document.getElementById('powExp').value);
    
    if(isNaN(b) || isNaN(e)) {
        document.getElementById('resPower').innerText = "-";
        return;
    }
    document.getElementById('resPower').innerText = Math.pow(b, e);
}