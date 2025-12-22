/**
 * Dependencies: None
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
            <div class="result-box"><span>Final Price: <span id="discFinal">0.00</span></span></div>
            <div class="result-box" style="margin-top:5px"><span>You Save: <span id="discSave">0.00</span></span></div>
        </div>

        <!-- Tip Calculator -->
        <div class="tool-card">
            <h3>Tip Calculator</h3>
            <p class="desc">Calculate tip amount and total bill.</p>
            <div class="row">
                <div>
                    <label>Bill Amount</label>
                    <input type="number" id="tipBill" oninput="calcTip()" placeholder="0.00">
                </div>
                <div>
                    <label>Tip %</label>
                    <input type="number" id="tipPercent" oninput="calcTip()" placeholder="15">
                </div>
            </div>
            <div class="result-box"><span>Tip Amount: <span id="tipAmt">0.00</span></span></div>
            <div class="result-box" style="margin-top:5px"><span>Total to Pay: <span id="tipTotal">0.00</span></span></div>
        </div>
    `;
    document.getElementById('Finance').innerHTML = html;
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
    const bill = parseFloat(document.getElementById('tipBill').value) || 0;
    const percent = parseFloat(document.getElementById('tipPercent').value) || 0;

    const tip = bill * (percent / 100);
    const total = bill + tip;

    document.getElementById('tipAmt').innerText = tip.toFixed(2);
    document.getElementById('tipTotal').innerText = total.toFixed(2);
}