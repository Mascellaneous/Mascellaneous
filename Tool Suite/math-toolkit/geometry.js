/**
 * Dependencies: None
 * Renders the Geometry tab content.
 */

function renderGeometry() {
    const html = `
        <!-- Rectangle -->
        <div class="tool-card">
            <h3>Rectangle Calculator</h3>
            <p class="desc">Calculate Area and Perimeter.</p>
            <div class="row">
                <div>
                    <label>Width</label>
                    <input type="number" id="rectW" oninput="calcRect()" placeholder="0">
                </div>
                <div>
                    <label>Height</label>
                    <input type="number" id="rectH" oninput="calcRect()" placeholder="0">
                </div>
            </div>
            <div class="result-box">
                <span>Area: <span id="rectArea">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('rectArea').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Perimeter: <span id="rectPerim">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('rectPerim').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Circle -->
        <div class="tool-card">
            <h3>Circle Calculator</h3>
            <p class="desc">Calculate Area and Circumference.</p>
            <label>Radius</label>
            <input type="number" id="circR" oninput="calcCircle()" placeholder="0">
            <div class="result-box">
                <span>Area: <span id="circArea">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('circArea').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Circumference: <span id="circCirc">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('circCirc').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Triangle (Right Angled) -->
        <div class="tool-card">
            <h3>Right Triangle Calculator</h3>
            <p class="desc">Calculate Area and Hypotenuse based on base and height.</p>
            <div class="row">
                <div>
                    <label>Base</label>
                    <input type="number" id="triBase" oninput="calcTriangle()" placeholder="0">
                </div>
                <div>
                    <label>Height</label>
                    <input type="number" id="triHeight" oninput="calcTriangle()" placeholder="0">
                </div>
            </div>
            <div class="result-box">
                <span>Area: <span id="triArea">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('triArea').innerText, this)" title="Copy">📋</button>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Hypotenuse: <span id="triHyp">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('triHyp').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Geometry').innerHTML = html;
}

function calcRect() {
    const w = parseFloat(document.getElementById('rectW').value) || 0;
    const h = parseFloat(document.getElementById('rectH').value) || 0;
    
    document.getElementById('rectArea').innerText = w * h;
    document.getElementById('rectPerim').innerText = 2 * (w + h);
}

function calcCircle() {
    const r = parseFloat(document.getElementById('circR').value) || 0;
    
    document.getElementById('circArea').innerText = (Math.PI * r * r).toFixed(2);
    document.getElementById('circCirc').innerText = (2 * Math.PI * r).toFixed(2);
}

function calcTriangle() {
    const b = parseFloat(document.getElementById('triBase').value) || 0;
    const h = parseFloat(document.getElementById('triHeight').value) || 0;

    // Area = 0.5 * b * h
    document.getElementById('triArea').innerText = (0.5 * b * h).toFixed(2);
    
    // Hypotenuse = sqrt(b^2 + h^2)
    document.getElementById('triHyp').innerText = Math.sqrt((b*b) + (h*h)).toFixed(2);
}