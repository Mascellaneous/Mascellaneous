/**
 * Dependencies: global-utils.js (for addCopyButtons)
 * Renders the Time & Date tab content.
 */

function renderTimeDate() {
    const html = `
        <!-- Time Difference -->
        <div class="tool-card">
            <h3>Time Difference</h3>
            <p class="desc">Calculate duration between two times (within 24h).</p>
            <div class="row">
                <div>
                    <label>Start Time</label>
                    <input type="time" id="timeDiffStart" oninput="calcTimeDiff()">
                </div>
                <div>
                    <label>End Time</label>
                    <input type="time" id="timeDiffEnd" oninput="calcTimeDiff()">
                </div>
            </div>
            <div class="result-box">
                <span>Duration: <span id="resTimeDiff">0h 0m</span></span>
            </div>
        </div>

        <!-- Date Difference -->
        <div class="tool-card">
            <h3>Date Difference</h3>
            <p class="desc">Calculate days between two dates.</p>
            <div class="row">
                <div>
                    <label>Start Date</label>
                    <input type="date" id="dateDiffStart" oninput="calcDateDiff()">
                </div>
                <div>
                    <label>End Date</label>
                    <input type="date" id="dateDiffEnd" oninput="calcDateDiff()">
                </div>
            </div>
            <div class="result-box">
                <span>Difference: <span id="resDateDiff">0 days</span></span>
            </div>
        </div>

        <!-- Unix Timestamp -->
        <div class="tool-card">
            <h3>Unix Timestamp Converter</h3>
            <p class="desc">Convert Date/Time to Unix Timestamp (Seconds).</p>
            <div class="row">
                <div>
                    <label>Select Date & Time</label>
                    <input type="datetime-local" id="unixInput" oninput="calcUnix()">
                </div>
            </div>
            <div class="result-box">
                <span>Timestamp: <span id="resUnix">0</span></span>
            </div>
            <div style="margin-top:10px; text-align:right;">
                <button onclick="setUnixNow()" style="padding:5px 10px; cursor:pointer;">Set to Now</button>
            </div>
        </div>

        <!-- Age Calculator -->
        <div class="tool-card">
            <h3>Age Calculator</h3>
            <p class="desc">Calculate precise age from birthdate.</p>
            <div class="row">
                <div>
                    <label>Date of Birth</label>
                    <input type="date" id="ageInput" oninput="calcAge()">
                </div>
            </div>
            <div class="result-box">
                <span>Age: <span id="resAge">0y 0m 0d</span></span>
            </div>
        </div>
    `;
    document.getElementById('TimeDate').innerHTML = html;

    // Automatically inject copy buttons
    if (typeof addCopyButtons === 'function') {
        addCopyButtons(document.getElementById('TimeDate'));
    }
}

function calcTimeDiff() {
    const startVal = document.getElementById('timeDiffStart').value;
    const endVal = document.getElementById('timeDiffEnd').value;
    
    if(startVal && endVal) {
        const start = new Date("2000-01-01T" + startVal);
        const end = new Date("2000-01-01T" + endVal);
        
        let diff = end - start;
        if (diff < 0) diff += 24 * 60 * 60 * 1000; // Handle overnight
        
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        
        document.getElementById('resTimeDiff').innerText = `${hours}h ${minutes}m`;
    } else {
        document.getElementById('resTimeDiff').innerText = "0h 0m";
    }
}

function calcDateDiff() {
    const startVal = document.getElementById('dateDiffStart').value;
    const endVal = document.getElementById('dateDiffEnd').value;

    if(startVal && endVal) {
        const start = new Date(startVal);
        const end = new Date(endVal);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        document.getElementById('resDateDiff').innerText = `${diffDays} days`;
    } else {
        document.getElementById('resDateDiff').innerText = "0 days";
    }
}

function calcUnix() {
    const val = document.getElementById('unixInput').value;
    if(val) {
        const date = new Date(val);
        const timestamp = Math.floor(date.getTime() / 1000);
        document.getElementById('resUnix').innerText = timestamp;
    } else {
        document.getElementById('resUnix').innerText = "0";
    }
}

function setUnixNow() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('unixInput').value = now.toISOString().slice(0,16);
    calcUnix();
}

function calcAge() {
    const val = document.getElementById('ageInput').value;
    if(val) {
        const dob = new Date(val);
        const now = new Date();
        
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        let days = now.getDate() - dob.getDate();

        if (months < 0 || (months === 0 && days < 0)) {
            years--;
            months += 12;
        }
        if (days < 0) {
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
            months--;
        }

        document.getElementById('resAge').innerText = `${years}y ${months}m ${days}d`;
    } else {
        document.getElementById('resAge').innerText = "0y 0m 0d";
    }
}