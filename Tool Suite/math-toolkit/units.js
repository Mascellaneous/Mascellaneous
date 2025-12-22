/**
 * Dependencies: None
 * Renders the Units tab content.
 */

function renderUnits() {
    const html = `
        <!-- Temperature -->
        <div class="tool-card">
            <h3>Temperature Converter</h3>
            <p class="desc">Type in one field to update the other.</p>
            <div class="row">
                <div>
                    <label>Celsius (°C)</label>
                    <input type="number" id="tempC" oninput="convertTemp('C')" placeholder="0">
                </div>
                <div>
                    <label>Fahrenheit (°F)</label>
                    <input type="number" id="tempF" oninput="convertTemp('F')" placeholder="32">
                </div>
            </div>
        </div>

        <!-- Length -->
        <div class="tool-card">
            <h3>Length Converter</h3>
            <p class="desc">Meters to Feet.</p>
            <div class="row">
                <div>
                    <label>Meters (m)</label>
                    <input type="number" id="lenM" oninput="convertLen('M')" placeholder="0">
                </div>
                <div>
                    <label>Feet (ft)</label>
                    <input type="number" id="lenF" oninput="convertLen('F')" placeholder="0">
                </div>
            </div>
        </div>
    `;
    document.getElementById('Units').innerHTML = html;
}

function convertTemp(source) {
    const cInput = document.getElementById('tempC');
    const fInput = document.getElementById('tempF');

    if (source === 'C') {
        const c = parseFloat(cInput.value);
        if (!isNaN(c)) {
            fInput.value = (c * 9/5 + 32).toFixed(2);
        } else {
            fInput.value = "";
        }
    } else {
        const f = parseFloat(fInput.value);
        if (!isNaN(f)) {
            cInput.value = ((f - 32) * 5/9).toFixed(2);
        } else {
            cInput.value = "";
        }
    }
}

function convertLen(source) {
    const mInput = document.getElementById('lenM');
    const fInput = document.getElementById('lenF');

    if (source === 'M') {
        const m = parseFloat(mInput.value);
        if (!isNaN(m)) {
            fInput.value = (m * 3.28084).toFixed(3);
        } else {
            fInput.value = "";
        }
    } else {
        const f = parseFloat(fInput.value);
        if (!isNaN(f)) {
            mInput.value = (f / 3.28084).toFixed(3);
        } else {
            mInput.value = "";
        }
    }
}