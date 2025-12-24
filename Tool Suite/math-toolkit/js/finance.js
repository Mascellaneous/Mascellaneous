/**
 * Dependencies: global-utils.js (for addCopyButtons)
 * Renders the Finance tab content.
 */

function renderFinance() {
    const html = `
        <!-- Discount Calculator -->
        <div class="tool-card">
            <h3>Discount Calculator</h3>
            <p class="desc">Calculate the final price after a percentage off.</p>
            <div class="row">
                <div>
                    <label>Original Price</label>
                    <input type="number" id="discPrice" oninput="calcDiscount()" placeholder="0.00">
                </div>
                <div>
                    <label>Discount %</label>
                    <input type="number" id="discPercent" oninput="calcDiscount()" placeholder="0">
                </div>
            </div>
            <div class="result-box">
                <span>Final Price: <span id="discFinal">0.00</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>You Save: <span id="discSave">0.00</span></span>
            </div>
        </div>

        <!-- Tip Calculator -->
        <div class="tool-card">
            <h3>Tip Calculator</h3>
            <p class="desc">Calculate tip amount and total bill.</p>
            <div class="row">
                <div>
                    <label>Bill Amount ($)</label>
                    <input type="number" id="finBill" oninput="calcTip()" placeholder="0.00">
                </div>
                <div>
                    <label>Tip %</label>
                    <input type="number" id="finTipPct" oninput="calcTip()" placeholder="15">
                </div>
            </div>
            <div class="result-box">
                <span>Tip Amount: $<span id="resTipAmt">0.00</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Total Bill: $<span id="resTotalBill">0.00</span></span>
            </div>
        </div>

        <!-- Loan Calculator -->
        <div class="tool-card">
            <h3>Loan / Mortgage Calculator</h3>
            <p class="desc">Calculate monthly payments (Amortized).</p>
            <div class="row">
                <div>
                    <label>Loan Amount ($)</label>
                    <input type="number" id="loanAmt" oninput="calcLoan()" placeholder="Principal">
                </div>
                <div>
                    <label>Interest Rate (%/yr)</label>
                    <input type="number" id="loanRate" oninput="calcLoan()" placeholder="Annual Rate">
                </div>
            </div>
            <div class="row">
                <div>
                    <label>Term (Years)</label>
                    <input type="number" id="loanYears" oninput="calcLoan()" placeholder="Years">
                </div>
                <div></div>
            </div>
            <div class="result-box">
                <span>Monthly Payment: $<span id="resLoanMo">0.00</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Total Cost: $<span id="resLoanTotal">0.00</span></span>
            </div>
        </div>

        <!-- TVM Calculator (Future Value) -->
        <div class="tool-card">
            <h3>Future Value Calculator</h3>
            <p class="desc">Calculate the future value of an investment (Compound Interest).</p>
            <div class="row">
                <div>
                    <label>Present Value (PV)</label>
                    <input type="number" id="tvmPV" oninput="calcTVM()" placeholder="Initial Amount">
                </div>
                <div>
                    <label>Interest Rate (%)</label>
                    <input type="number" id="tvmRate" oninput="calcTVM()" placeholder="Annual Rate">
                </div>
            </div>
            <div class="row">
                <div>
                    <label>Years (t)</label>
                    <input type="number" id="tvmYears" oninput="calcTVM()" placeholder="Duration">
                </div>
                <div>
                    <!-- Empty spacer for alignment -->
                </div>
            </div>
            <div class="result-box">
                <span>Future Value (FV): $<span id="resFV">0.00</span></span>
            </div>
            <p class="desc" style="margin-top:5px; font-size:0.8rem;">Formula: FV = PV * (1 + r/100)^t</p>
        </div>
        
        <!-- Present Value Calculator -->
        <div class="tool-card">
            <h3>Present Value Calculator</h3>
            <p class="desc">Calculate the amount needed today to reach a future goal.</p>
            <div class="row">
                <div>
                    <label>Target Future Value ($)</label>
                    <input type="number" id="pvTargetFV" oninput="calcPV()" placeholder="Goal Amount">
                </div>
                <div>
                    <label>Interest Rate (%)</label>
                    <input type="number" id="pvRate" oninput="calcPV()" placeholder="Annual Rate">
                </div>
            </div>
            <div class="row">
                <div>
                    <label>Years (t)</label>
                    <input type="number" id="pvYears" oninput="calcPV()" placeholder="Duration">
                </div>
                <div>
                    <!-- Empty spacer for alignment -->
                </div>
            </div>
            <div class="result-box">
                <span>Present Value (PV): $<span id="resPV">0.00</span></span>
            </div>
            <p class="desc" style="margin-top:5px; font-size:0.8rem;">Formula: PV = FV / (1 + r/100)^t</p>
        </div>
    `;
    document.getElementById('Finance').innerHTML = html;

    // Automatically inject copy buttons
    if (typeof addCopyButtons === 'function') {
        addCopyButtons(document.getElementById('Finance'));
    }
}

function calcDiscount() {
    const price = parseFloat(document.getElementById('discPrice').value) || 0;
    const percent = parseFloat(document.getElementById('discPercent').value) || 0;

    const savings = price * (percent / 100);
    const final = price - savings;

    document.getElementById('discFinal').innerText = final.toFixed(2);
    document.getElementById('discSave').innerText = savings.toFixed(2);
}

function calcTip() {
    const bill = parseFloat(document.getElementById('finBill').value) || 0;
    const tipPct = parseFloat(document.getElementById('finTipPct').value) || 0;

    const tipAmt = bill * (tipPct / 100);
    const total = bill + tipAmt;

    document.getElementById('resTipAmt').innerText = tipAmt.toFixed(2);
    document.getElementById('resTotalBill').innerText = total.toFixed(2);
}

function calcLoan() {
    const p = parseFloat(document.getElementById('loanAmt').value) || 0;
    const r_annual = parseFloat(document.getElementById('loanRate').value) || 0;
    const years = parseFloat(document.getElementById('loanYears').value) || 0;

    if (p <= 0 || years <= 0) {
        document.getElementById('resLoanMo').innerText = "0.00";
        document.getElementById('resLoanTotal').innerText = "0.00";
        return;
    }

    // Monthly rate
    const r = (r_annual / 100) / 12; 
    const n = years * 12;

    let payment = 0;
    if (r === 0) {
        payment = p / n;
    } else {
        payment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    document.getElementById('resLoanMo').innerText = payment.toFixed(2);
    document.getElementById('resLoanTotal').innerText = (payment * n).toFixed(2);
}

function calcTVM() {
    const pv = parseFloat(document.getElementById('tvmPV').value) || 0;
    const r = parseFloat(document.getElementById('tvmRate').value) || 0;
    const t = parseFloat(document.getElementById('tvmYears').value) || 0;

    // FV = PV * (1 + r)^t
    // Note: Input r is percentage, so we divide by 100
    const fv = pv * Math.pow((1 + (r / 100)), t);

    document.getElementById('resFV').innerText = fv.toFixed(2);
}

function calcPV() {
    const fv = parseFloat(document.getElementById('pvTargetFV').value) || 0;
    const r = parseFloat(document.getElementById('pvRate').value) || 0;
    const t = parseFloat(document.getElementById('pvYears').value) || 0;

    // PV = FV / (1 + r)^t
    // Note: Input r is percentage, so we divide by 100
    // If r is -100 (which would cause division by zero), we handle implicitly by JS Infinity or check
    let pv = 0;
    if (r === -100) {
        pv = 0; 
    } else {
        pv = fv / Math.pow((1 + (r / 100)), t);
    }

    document.getElementById('resPV').innerText = pv.toFixed(2);
}