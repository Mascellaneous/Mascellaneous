/**
 * Dependencies: None
 * Renders the Statistics tab content.
 */

function renderStatistics() {
    const html = `
        <!-- List Analyzer -->
        <div class="tool-card">
            <h3>Number List Analyzer</h3>
            <p class="desc">Enter numbers separated by commas, spaces, or new lines.</p>
            <label>Input List</label>
            <textarea id="statInput" oninput="calcStats()" placeholder="10, 20, 5, 100"></textarea>
            
            <div class="row">
                <div class="result-box"><span>Sum: <span id="statSum">-</span></span></div>
                <div class="result-box"><span>Count: <span id="statCount">-</span></span></div>
            </div>
            <div class="row" style="margin-top:10px">
                <div class="result-box"><span>Average: <span id="statAvg">-</span></span></div>
                <div class="result-box"><span>Max: <span id="statMax">-</span></span></div>
            </div>
             <div class="row" style="margin-top:10px">
                <div class="result-box"><span>Min: <span id="statMin">-</span></span></div>
            </div>
        </div>
    `;
    document.getElementById('Statistics').innerHTML = html;
}

function calcStats() {
    const text = document.getElementById('statInput').value;
    // Split by comma, space, or newline, filter out empty strings
    const items = text.split(/[\s,]+/).filter(item => item.trim() !== "" && !isNaN(item));
    const numbers = items.map(Number);

    if (numbers.length === 0) {
        document.getElementById('statSum').innerText = "-";
        document.getElementById('statCount').innerText = "0";
        document.getElementById('statAvg').innerText = "-";
        document.getElementById('statMax').innerText = "-";
        document.getElementById('statMin').innerText = "-";
        return;
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const avg = sum / numbers.length;

    document.getElementById('statSum').innerText = sum;
    document.getElementById('statCount').innerText = numbers.length;
    document.getElementById('statAvg').innerText = avg.toFixed(2);
    document.getElementById('statMax').innerText = max;
    document.getElementById('statMin').innerText = min;
}