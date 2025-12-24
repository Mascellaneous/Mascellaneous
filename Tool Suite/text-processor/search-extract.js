/**
 * Dependencies: None
 * Contains functions for finding index positions, counting occurrences, and extracting substrings/patterns.
 * Renders the Search & Extract tab content.
 */

function renderSearchExtract() {
    const html = `
        <!-- Find First -->
        <div class="tool-card">
            <h3>Find First Occurrence</h3>
            <p class="desc">Finds position number where text first appears (starts at 0). Ex: "Hello", find "e" → 1</p>
            <label>Main Text</label>
            <input type="text" id="findFirstMain" oninput="findFirst()" placeholder="Main text...">
            <label>Find What?</label>
            <input type="text" id="findFirstTarget" oninput="findFirst()" placeholder="Search string...">
            <div class="result-box">
                <span>Result: <span id="findFirstResult">Waiting...</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('findFirstResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Find Last -->
        <div class="tool-card">
            <h3>Find Last Occurrence</h3>
            <p class="desc">Finds position number where text appears last. Ex: "Hello", find "l" → 3</p>
            <label>Main Text</label>
            <input type="text" id="findLastMain" oninput="findLast()" placeholder="Main text...">
            <label>Find What?</label>
            <input type="text" id="findLastTarget" oninput="findLast()" placeholder="Search string...">
            <div class="result-box">
                <span>Result: <span id="findLastResult">Waiting...</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('findLastResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Count Occurrences -->
        <div class="tool-card">
            <h3>Count Occurrences</h3>
            <p class="desc">Counts how many times a specific text appears.</p>
            <label>Main Text</label>
            <input type="text" id="countOccMain" oninput="countOccurrences()" placeholder="Main text...">
            <label>Find What?</label>
            <input type="text" id="countOccTarget" oninput="countOccurrences()" placeholder="Search string...">
            <div class="result-box">
                <span>Result: <span id="countOccResult">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('countOccResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Extract Segment -->
        <div class="tool-card">
            <h3>Extract Text Segment</h3>
            <p class="desc">Cuts out part of the text based on positions. Ex: "Hello", 0 to 2 → "He"</p>
            <label>Original Text</label>
            <input type="text" id="extractMain" oninput="extractText()" placeholder="Original text...">
            <div class="row">
                <div>
                    <label>Start</label>
                    <input type="number" id="extractStart" oninput="extractText()" placeholder="0">
                </div>
                <div>
                    <label>End</label>
                    <input type="number" id="extractEnd" oninput="extractText()" placeholder="0">
                </div>
            </div>
            <div class="result-box">
                <span>Result: <span id="extractResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('extractResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Extract Emails -->
        <div class="tool-card">
            <h3>Extract Emails</h3>
            <p class="desc">Finds and lists all email addresses found in the text.</p>
            <label>Text Block</label>
            <textarea id="emailInput" oninput="extractEmails()" placeholder="Paste text with emails here..."></textarea>
            <div class="result-box">
                <span>Result: <span id="emailResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('emailResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('SearchExtract').innerHTML = html;
}

// Find First Occurrence
function findFirst() {
    const mainText = document.getElementById('findFirstMain').value;
    const target = document.getElementById('findFirstTarget').value;
    
    if (target === "") {
        document.getElementById('findFirstResult').innerText = "Waiting...";
        return;
    }

    const result = mainText.indexOf(target);
    document.getElementById('findFirstResult').innerText = result;
}

// Find Last Occurrence
function findLast() {
    const mainText = document.getElementById('findLastMain').value;
    const target = document.getElementById('findLastTarget').value;

    if (target === "") {
        document.getElementById('findLastResult').innerText = "Waiting...";
        return;
    }

    const result = mainText.lastIndexOf(target);
    document.getElementById('findLastResult').innerText = result;
}

// Count Occurrences
function countOccurrences() {
    const mainText = document.getElementById('countOccMain').value;
    const target = document.getElementById('countOccTarget').value;

    if (target === "" || mainText === "") {
        document.getElementById('countOccResult').innerText = "0";
        return;
    }

    // Split by target and subtract 1 to get count
    const count = mainText.split(target).length - 1;
    document.getElementById('countOccResult').innerText = count;
}

// Extract Text Segment
function extractText() {
    const text = document.getElementById('extractMain').value;
    const start = parseInt(document.getElementById('extractStart').value) || 0;
    const end = parseInt(document.getElementById('extractEnd').value) || 0;

    if(end === 0 && start === 0 && text.length > 0) {
         document.getElementById('extractResult').innerText = "";
         return;
    }

    try {
        const result = text.substring(start, end);
        document.getElementById('extractResult').innerText = result;
    } catch (e) {
        document.getElementById('extractResult').innerText = "Error";
    }
}

// Extract Emails
function extractEmails() {
    const text = document.getElementById('emailInput').value;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = text.match(emailRegex);

    if (matches) {
        // Join with comma and space
        document.getElementById('emailResult').innerText = matches.join(', ');
    } else {
        document.getElementById('emailResult').innerText = "No emails found";
    }
}