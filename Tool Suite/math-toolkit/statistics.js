/**
 * Dependencies: None
 * Renders the Statistics tab content.
 */

function renderStatistics() {
    const html = `
        <div class="tool-card">
            <h3>Number List Analyzer</h3>
            <p class="desc">Enter numbers separated by commas (e.g., 10, 20, 5, 40).</p>
            <textarea id="statInput" rows="3" placeholder="1, 2, 3..." oninput="calcStats()"></textarea>
            
            <div class="row" style="margin-top:10px;">
                <div class="result-box">
                    <span>Count: <span id="statCount">0</span></span>
                    <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statCount').innerText, this)" title="Copy">📋</button>
                </div>
                <div class="result-box">
                    <span>Sum: <span id="statSum">0</span></span>
                    <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statSum').innerText, this)" title="Copy">📋</button>
                </div>
            </div>
            <div class="row" style="margin-top:5px;">
                <div class="result-box">
                    <span>Average (Mean): <span id="statAvg">0</span></span>
                    <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statAvg').innerText, this)" title="Copy">📋</button>
                </div>
                <div class="result-box">
                    <span>Median: <span id="statMedian">0</span></span>
                    <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statMedian').innerText, this)" title="Copy">📋</button>
                </div>
            </div>
            <div class="result-box" style="margin-top:5px;">
                <span>Mode: <span id="statMode">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statMode').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px;">
                <span>Max: <span id="statMax">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statMax').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px;">
                <span>Min: <span id="statMin">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('statMin').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Statistics').innerHTML = html;
}

function calcStats() {
    const input = document.getElementById('statInput').value;
    // Split by comma, map to number, filter out NaNs
    const nums = input.split(',')
                      .map(n => parseFloat(n.trim()))
                      .filter(n => !isNaN(n));

    if (nums.length === 0) {
        document.getElementById('statCount').innerText = 0;
        document.getElementById('statSum').innerText = 0;
        document.getElementById('statAvg').innerText = 0;
        document.getElementById('statMax').innerText = 0;
        document.getElementById('statMin').innerText = 0;
        document.getElementById('statMedian').innerText = 0;
        document.getElementById('statMode').innerText = "-";
        return;
    }

    // Basic Stats
    const count = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const max = Math.max(...nums);
    const min = Math.min(...nums);

    // Median Calculation
    const sorted = [...nums].sort((a, b) => a - b);
    let median = 0;
    if (count % 2 === 0) {
        // Even number of elements: average of two middle numbers
        median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
    } else {
        // Odd number of elements: middle number
        median = sorted[Math.floor(count / 2)];
    }

    // Mode Calculation
    const frequency = {};
    let maxFreq = 0;
    let modes = [];

    nums.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFreq) {
            maxFreq = frequency[num];
        }
    });

    for (const num in frequency) {
        if (frequency[num] === maxFreq) {
            modes.push(num);
        }
    }
    // If all numbers appear once, or all appear same amount, it's often considered "no mode" or "multimodal"
    // For simplicity, if count equals modes length (all unique), we say "None"
    let modeStr = modes.join(', ');
    if (modes.length === count && count > 1) modeStr = "None (All unique)";


    document.getElementById('statCount').innerText = count;
    document.getElementById('statSum').innerText = sum;
    document.getElementById('statAvg').innerText = avg.toFixed(2);
    document.getElementById('statMax').innerText = max;
    document.getElementById('statMin').innerText = min;
    document.getElementById('statMedian').innerText = median;
    document.getElementById('statMode').innerText = modeStr;
}