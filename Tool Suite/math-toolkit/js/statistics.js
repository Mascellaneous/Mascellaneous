/**
 * Dependencies: global-utils.js (for addCopyButtons)
 * Renders the Statistics tab content.
 */

function renderStatistics() {
    const html = `
        <div class="tool-card">
            <h3>Descriptive Statistics</h3>
            <p class="desc">Enter numbers separated by commas (e.g., 10, 20, 5, 40).</p>
            <textarea id="statInput" rows="3" placeholder="1, 2, 3..." oninput="calcStats()"></textarea>
            
            <div class="row" style="margin-top:10px;">
                <div class="result-box">
                    <span>Count (N): <span id="statCount">0</span></span>
                </div>
                <div class="result-box">
                    <span>Sum (Σ): <span id="statSum">0</span></span>
                </div>
            </div>
            
            <div class="row" style="margin-top:5px;">
                <div class="result-box">
                    <span>Mean (μ): <span id="statAvg">0</span></span>
                </div>
                <div class="result-box">
                    <span>Median: <span id="statMedian">0</span></span>
                </div>
            </div>

            <div class="row" style="margin-top:5px;">
                <div class="result-box">
                    <span>Min: <span id="statMin">0</span></span>
                </div>
                <div class="result-box">
                    <span>Max: <span id="statMax">0</span></span>
                </div>
            </div>

            <div class="result-box" style="margin-top:5px;">
                <span>Range: <span id="statRange">0</span></span>
            </div>

            <div class="result-box" style="margin-top:5px;">
                <span>Mode: <span id="statMode">0</span></span>
            </div>

            <h4 style="margin-top:15px; margin-bottom:5px; color:#2980b9;">Variance & Deviation</h4>
            <div class="result-box">
                <span>Std Dev (Sample, s): <span id="statStdDevS">0</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Std Dev (Population, σ): <span id="statStdDevP">0</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Variance (s²): <span id="statVar">0</span></span>
            </div>
        </div>
    `;
    document.getElementById('Statistics').innerHTML = html;
    
    // Automatically inject copy buttons
    if (typeof addCopyButtons === 'function') {
        addCopyButtons(document.getElementById('Statistics'));
    }
}

function calcStats() {
    const input = document.getElementById('statInput').value;
    const nums = input.split(',')
                      .map(n => parseFloat(n.trim()))
                      .filter(n => !isNaN(n));

    if (nums.length === 0) {
        resetStats();
        return;
    }

    // Basic Stats
    const count = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    const range = max - min;

    // Median
    const sorted = [...nums].sort((a, b) => a - b);
    let median = 0;
    if (count % 2 === 0) {
        median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
    } else {
        median = sorted[Math.floor(count / 2)];
    }

    // Mode
    const frequency = {};
    let maxFreq = 0;
    let modes = [];
    nums.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFreq) maxFreq = frequency[num];
    });
    for (const num in frequency) {
        if (frequency[num] === maxFreq) modes.push(num);
    }
    let modeStr = modes.join(', ');
    if (modes.length === count && count > 1) modeStr = "None (All unique)";

    // Standard Deviation & Variance
    // Variance = sum((x - mean)^2) / n (or n-1)
    const squaredDiffs = nums.map(n => Math.pow(n - avg, 2));
    const sumSquaredDiffs = squaredDiffs.reduce((a, b) => a + b, 0);
    
    const varianceSample = count > 1 ? sumSquaredDiffs / (count - 1) : 0;
    const variancePop = sumSquaredDiffs / count;
    
    const stdDevSample = Math.sqrt(varianceSample);
    const stdDevPop = Math.sqrt(variancePop);

    // Update DOM
    document.getElementById('statCount').innerText = count;
    document.getElementById('statSum').innerText = sum.toFixed(2);
    document.getElementById('statAvg').innerText = avg.toFixed(4);
    document.getElementById('statMax').innerText = max;
    document.getElementById('statMin').innerText = min;
    document.getElementById('statRange').innerText = range;
    document.getElementById('statMedian').innerText = median;
    document.getElementById('statMode').innerText = modeStr;
    
    document.getElementById('statStdDevS').innerText = stdDevSample.toFixed(4);
    document.getElementById('statStdDevP').innerText = stdDevPop.toFixed(4);
    document.getElementById('statVar').innerText = varianceSample.toFixed(4);
}

function resetStats() {
    ['statCount', 'statSum', 'statAvg', 'statMax', 'statMin', 'statRange', 'statMedian', 'statStdDevS', 'statStdDevP', 'statVar'].forEach(id => {
        document.getElementById(id).innerText = 0;
    });
    document.getElementById('statMode').innerText = "-";
}