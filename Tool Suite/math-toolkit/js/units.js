/**
 * Dependencies: None
 * Renders the Units tab content.
 */

function renderUnits() {
    const html = `
        <!-- Temperature -->
        <div class="tool-card">
            <h3>Temperature</h3>
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
            <h3>Length</h3>
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

        <!-- Mass -->
        <div class="tool-card">
            <h3>Mass / Weight</h3>
            <div class="row">
                <div>
                    <label>Kilograms (kg)</label>
                    <input type="number" id="massKg" oninput="convertMass('K')" placeholder="0">
                </div>
                <div>
                    <label>Pounds (lbs)</label>
                    <input type="number" id="massLbs" oninput="convertMass('L')" placeholder="0">
                </div>
            </div>
        </div>

        <!-- Digital Storage -->
        <div class="tool-card">
            <h3>Digital Storage</h3>
            <div class="row">
                <div>
                    <label>Megabytes (MB)</label>
                    <input type="number" id="digMB" oninput="convertDigital('MB')" placeholder="0">
                </div>
                <div>
                    <label>Gigabytes (GB)</label>
                    <input type="number" id="digGB" oninput="convertDigital('GB')" placeholder="0">
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
        if (!isNaN(c)) fInput.value = (c * 9/5 + 32).toFixed(2);
        else fInput.value = "";
    } else {
        const f = parseFloat(fInput.value);
        if (!isNaN(f)) cInput.value = ((f - 32) * 5/9).toFixed(2);
        else cInput.value = "";
    }
}

function convertLen(source) {
    const mInput = document.getElementById('lenM');
    const fInput = document.getElementById('lenF');
    if (source === 'M') {
        const m = parseFloat(mInput.value);
        if (!isNaN(m)) fInput.value = (m * 3.28084).toFixed(3);
        else fInput.value = "";
    } else {
        const f = parseFloat(fInput.value);
        if (!isNaN(f)) mInput.value = (f / 3.28084).toFixed(3);
        else mInput.value = "";
    }
}

function convertMass(source) {
    const kInput = document.getElementById('massKg');
    const lInput = document.getElementById('massLbs');
    const factor = 2.20462;

    if (source === 'K') {
        const k = parseFloat(kInput.value);
        if (!isNaN(k)) lInput.value = (k * factor).toFixed(3);
        else lInput.value = "";
    } else {
        const l = parseFloat(lInput.value);
        if (!isNaN(l)) kInput.value = (l / factor).toFixed(3);
        else kInput.value = "";
    }
}

function convertDigital(source) {
    const mbInput = document.getElementById('digMB');
    const gbInput = document.getElementById('digGB');
    const factor = 1024; // Using binary definition

    if (source === 'MB') {
        const mb = parseFloat(mbInput.value);
        if (!isNaN(mb)) gbInput.value = (mb / factor).toFixed(4);
        else gbInput.value = "";
    } else {
        const gb = parseFloat(gbInput.value);
        if (!isNaN(gb)) mbInput.value = (gb * factor).toFixed(2);
        else mbInput.value = "";
    }
}