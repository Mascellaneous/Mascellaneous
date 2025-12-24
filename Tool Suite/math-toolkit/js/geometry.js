/**
 * Dependencies: global-utils.js (for addCopyButtons)
 * Renders the Geometry tab content.
 */

function renderGeometry() {
    const html = `
        <!-- Rectangle -->
        <div class="tool-card">
            <h3>Rectangle</h3>
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
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Perimeter: <span id="rectPerim">0</span></span>
            </div>
        </div>

        <!-- Circle -->
        <div class="tool-card">
            <h3>Circle</h3>
            <label>Radius</label>
            <input type="number" id="circR" oninput="calcCircle()" placeholder="0">
            <div class="result-box">
                <span>Area: <span id="circArea">0</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Circumference: <span id="circCirc">0</span></span>
            </div>
        </div>

        <!-- Triangle (Right Angled) -->
        <div class="tool-card">
            <h3>Right Triangle</h3>
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
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Hypotenuse: <span id="triHyp">0</span></span>
            </div>
        </div>

        <!-- Sphere -->
        <div class="tool-card">
            <h3>Sphere (3D)</h3>
            <label>Radius</label>
            <input type="number" id="sphR" oninput="calcSphere()" placeholder="0">
            <div class="result-box">
                <span>Volume: <span id="sphVol">0</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Surface Area: <span id="sphArea">0</span></span>
            </div>
        </div>

        <!-- Cylinder -->
        <div class="tool-card">
            <h3>Cylinder (3D)</h3>
            <div class="row">
                <div>
                    <label>Radius</label>
                    <input type="number" id="cylR" oninput="calcCylinder()" placeholder="0">
                </div>
                <div>
                    <label>Height</label>
                    <input type="number" id="cylH" oninput="calcCylinder()" placeholder="0">
                </div>
            </div>
            <div class="result-box">
                <span>Volume: <span id="cylVol">0</span></span>
            </div>
            <div class="result-box" style="margin-top:5px">
                <span>Surface Area: <span id="cylArea">0</span></span>
            </div>
        </div>
    `;
    document.getElementById('Geometry').innerHTML = html;

    // Automatically inject copy buttons
    if (typeof addCopyButtons === 'function') {
        addCopyButtons(document.getElementById('Geometry'));
    }
}

function calcRect() {
    const w = parseFloat(document.getElementById('rectW').value) || 0;
    const h = parseFloat(document.getElementById('rectH').value) || 0;
    document.getElementById('rectArea').innerText = (w * h).toFixed(2);
    document.getElementById('rectPerim').innerText = (2 * (w + h)).toFixed(2);
}

function calcCircle() {
    const r = parseFloat(document.getElementById('circR').value) || 0;
    document.getElementById('circArea').innerText = (Math.PI * r * r).toFixed(2);
    document.getElementById('circCirc').innerText = (2 * Math.PI * r).toFixed(2);
}

function calcTriangle() {
    const b = parseFloat(document.getElementById('triBase').value) || 0;
    const h = parseFloat(document.getElementById('triHeight').value) || 0;
    document.getElementById('triArea').innerText = (0.5 * b * h).toFixed(2);
    document.getElementById('triHyp').innerText = Math.sqrt((b*b) + (h*h)).toFixed(2);
}

function calcSphere() {
    const r = parseFloat(document.getElementById('sphR').value) || 0;
    // Volume = 4/3 * pi * r^3
    document.getElementById('sphVol').innerText = ((4/3) * Math.PI * Math.pow(r, 3)).toFixed(2);
    // Surface Area = 4 * pi * r^2
    document.getElementById('sphArea').innerText = (4 * Math.PI * Math.pow(r, 2)).toFixed(2);
}

function calcCylinder() {
    const r = parseFloat(document.getElementById('cylR').value) || 0;
    const h = parseFloat(document.getElementById('cylH').value) || 0;
    // Volume = pi * r^2 * h
    document.getElementById('cylVol').innerText = (Math.PI * Math.pow(r, 2) * h).toFixed(2);
    // Surface Area = 2*pi*r*h + 2*pi*r^2
    document.getElementById('cylArea').innerText = ((2 * Math.PI * r * h) + (2 * Math.PI * Math.pow(r, 2))).toFixed(2);
}