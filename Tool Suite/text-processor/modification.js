/**
 * Dependencies: None
 * Contains functions for adding text to lines, removing spaces, repeating, reversing, sorting, and deduplicating.
 * Renders the Modification tab content.
 */

function renderModification() {
    const html = `
        <!-- Add Text to Lines -->
        <div class="tool-card">
            <h3>Add Text to Lines</h3>
            <p class="desc">Adds text to the start or end of every line. Ex: Front "-" → "-Item"</p>
            <label>List of Items</label>
            <textarea id="addLinesInput" placeholder="Item 1&#10;Item 2"></textarea>
            <div class="row">
                <div>
                    <label>Front</label>
                    <input type="text" id="addFront" oninput="addTextToLines()" placeholder="Prefix...">
                </div>
                <div>
                    <label>Back</label>
                    <input type="text" id="addBack" oninput="addTextToLines()" placeholder="Suffix...">
                </div>
            </div>
            <label>Result</label>
            <div class="result-box multi-line">
                <textarea id="addLinesResult" readonly></textarea>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('addLinesResult').value, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Sort Lines -->
        <div class="tool-card">
            <h3>Sort Lines</h3>
            <p class="desc">Sorts a list of items alphabetically.</p>
            <label>List of Items</label>
            <textarea id="sortInput" placeholder="Banana&#10;Apple&#10;Cherry"></textarea>
            <div class="row" style="margin-bottom: 10px;">
                <button onclick="sortLines('asc')" style="padding:5px 10px;">Sort A-Z</button>
                <button onclick="sortLines('desc')" style="padding:5px 10px;">Sort Z-A</button>
            </div>
            <label>Result</label>
            <div class="result-box multi-line">
                <textarea id="sortResult" readonly></textarea>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('sortResult').value, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Remove Duplicate Lines -->
        <div class="tool-card">
            <h3>Remove Duplicate Lines</h3>
            <p class="desc">Removes identical lines from a list.</p>
            <label>List of Items</label>
            <textarea id="dedupeInput" oninput="removeDuplicates()" placeholder="Apple&#10;Apple&#10;Banana"></textarea>
            <label>Result</label>
            <div class="result-box multi-line">
                <textarea id="dedupeResult" readonly></textarea>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('dedupeResult').value, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Remove Spaces -->
        <div class="tool-card">
            <h3>Remove All Spaces</h3>
            <p class="desc">Deletes every space character. Ex: "a b c" → "abc"</p>
            <label>Input Text</label>
            <input type="text" id="noSpaceInput" oninput="removeSpaces()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="noSpaceResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('noSpaceResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Repeat Text -->
        <div class="tool-card">
            <h3>Repeat Text</h3>
            <p class="desc">Repeats the input text multiple times. Ex: "Hi", 3 times → "HiHiHi"</p>
            <label>Text to Repeat</label>
            <input type="text" id="repeatInput" oninput="repeatText()" placeholder="Text...">
            <label>Times</label>
            <input type="number" id="repeatCount" oninput="repeatText()" placeholder="0">
            <div class="result-box">
                <span>Result: <span id="repeatResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('repeatResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Reverse Text -->
        <div class="tool-card">
            <h3>Reverse Text</h3>
            <p class="desc">Flips the text backwards. Ex: "abc" → "cba"</p>
            <label>Input Text</label>
            <input type="text" id="reverseInput" oninput="reverseText()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="reverseResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('reverseResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Modification').innerHTML = html;
}

// Add Text to Lines
function addTextToLines() {
    const text = document.getElementById('addLinesInput').value;
    const front = document.getElementById('addFront').value;
    const back = document.getElementById('addBack').value;

    const lines = text.split(/\r\n|\r|\n/);
    const newLines = lines.map(line => front + line + back);
    
    document.getElementById('addLinesResult').value = newLines.join('\n');
}

// Sort Lines
function sortLines(direction) {
    const text = document.getElementById('sortInput').value;
    // Filter out empty lines to avoid sorting issues with blank space
    let lines = text.split(/\r\n|\r|\n/).filter(line => line.trim() !== "");
    
    if (direction === 'asc') {
        lines.sort();
    } else {
        lines.sort().reverse();
    }
    
    document.getElementById('sortResult').value = lines.join('\n');
}

// Remove Duplicate Lines
function removeDuplicates() {
    const text = document.getElementById('dedupeInput').value;
    const lines = text.split(/\r\n|\r|\n/);
    
    // Use Set to remove duplicates automatically
    const uniqueLines = [...new Set(lines)];
    
    document.getElementById('dedupeResult').value = uniqueLines.join('\n');
}

// Remove All Spaces
function removeSpaces() {
    const text = document.getElementById('noSpaceInput').value;
    const result = text.replace(/\s+/g, '');
    document.getElementById('noSpaceResult').innerText = result;
}

// Repeat Text
function repeatText() {
    const text = document.getElementById('repeatInput').value;
    let count = parseInt(document.getElementById('repeatCount').value);
    
    if (isNaN(count) || count < 0) count = 0;

    document.getElementById('repeatResult').innerText = text.repeat(count);
}

// Reverse Text
function reverseText() {
    const text = document.getElementById('reverseInput').value;
    const result = text.split('').reverse().join('');
    document.getElementById('reverseResult').innerText = result;
}