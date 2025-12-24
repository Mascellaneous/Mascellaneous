/**
 * Dependencies: global-utils.js (for addCopyButtons)
 * Renders the Arithmetic tab content.
 */

function renderArithmetic() {
    const html = `
        <!-- Quick Operators -->
        <div class="tool-card">
            <h3>Quick Operators</h3>
            <p class="desc">Performs basic math, powers, and roots on two numbers simultaneously.</p>
            <div class="row">
                <div>
                    <label>Number A (Base/Numerator)</label>
                    <input type="number" id="mathA" oninput="calcBasic()" placeholder="0">
                </div>
                <div>
                    <label>Number B (Exponent/Divisor)</label>
                    <input type="number" id="mathB" oninput="calcBasic()" placeholder="0">
                </div>
            </div>
            <label>Results</label>
            <div class="result-box">
                <span>Sum (A+B): <span id="resSum">-</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Difference (A-B): <span id="resDiff">-</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Product (A*B): <span id="resProd">-</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Quotient (A/B): <span id="resQuot">-</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Modulo (A % B): <span id="resMod">-</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Power (A^B): <span id="resPow">-</span></span>
            </div>
             <div class="result-box" style="margin-top:5px">
                <span>Root (B√A): <span id="resRoot">-</span></span>
            </div>
        </div>

        <!-- Logarithms -->
        <div class="tool-card">
            <h3>Logarithms</h3>
            <p class="desc">Calculate natural logarithm (ln) and base-10 logarithm.</p>
            <label>Input Number (x)</label>
            <input type="number" id="logInput" oninput="calcLogs()" placeholder="Enter positive number">
            
            <div class="result-box">
                <span>Natural Log (ln x): <span id="resLn">-</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Log Base 10 (log10 x): <span id="resLog10">-</span></span>
            </div>
        </div>
    `;
    document.getElementById('Arithmetic').innerHTML = html;

    // Automatically inject copy buttons
    if (typeof addCopyButtons === 'function') {
        addCopyButtons(document.getElementById('Arithmetic'));
    }
}

function calcBasic() {
    const a = parseFloat(document.getElementById('mathA').value) || 0;
    const b = parseFloat(document.getElementById('mathB').value) || 0;

    // Basic Math
    document.getElementById('resSum').innerText = a + b;
    document.getElementById('resDiff').innerText = a - b;
    document.getElementById('resProd').innerText = a * b;
    document.getElementById('resQuot').innerText = b !== 0 ? (a / b).toFixed(4) : "Undefined";
    document.getElementById('resMod').innerText = b !== 0 ? (a % b) : "Undefined";
    
    // Power (A^B)
    document.getElementById('resPow').innerText = Math.pow(a, b);

    // Root (Bth root of A) -> A^(1/B)
    if (b !== 0 && a >= 0) {
        document.getElementById('resRoot').innerText = Math.pow(a, 1/b).toFixed(4);
    } else {
        document.getElementById('resRoot').innerText = "Undefined";
    }
}

function calcLogs() {
    const x = parseFloat(document.getElementById('logInput').value);
    
    if (x > 0) {
        document.getElementById('resLn').innerText = Math.log(x).toFixed(5);
        document.getElementById('resLog10').innerText = Math.log10(x).toFixed(5);
    } else {
        document.getElementById('resLn').innerText = "Undefined";
        document.getElementById('resLog10').innerText = "Undefined";
    }
}