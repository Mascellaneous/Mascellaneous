/**
 * Dependencies: None
 * Contains functions for Character, Line, Word counting, Reading Time, and Longest Word.
 * Renders the Analysis tab content.
 */

function renderAnalysis() {
    const html = `
        <!-- Character Counter -->
        <div class="tool-card">
            <h3>Character Counter</h3>
            <p class="desc">Counts every character including spaces. Ex: "Hello" → 5</p>
            <label>Text to Count</label>
            <textarea id="charInput" oninput="countCharacters()" placeholder="Type here..."></textarea>
            <div class="result-box">
                <span>Result: <span id="charResult">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('charResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Line Counter -->
        <div class="tool-card">
            <h3>Line Counter</h3>
            <p class="desc">Counts how many lines are in the text. Ex: 3 lines → 3</p>
            <label>Multi-line Text</label>
            <textarea id="lineInput" oninput="countLines()" placeholder="Type here..."></textarea>
            <div class="result-box">
                <span>Result: <span id="lineResult">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('lineResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Word Counter -->
        <div class="tool-card">
            <h3>Word Counter</h3>
            <p class="desc">Counts words separated by spaces. Ex: "Hello World" → 2</p>
            <label>Text</label>
            <textarea id="wordInput" oninput="countWords()" placeholder="Type here..."></textarea>
            <div class="result-box">
                <span>Result: <span id="wordResult">0</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('wordResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Longest Word -->
        <div class="tool-card">
            <h3>Longest Word Finder</h3>
            <p class="desc">Identifies the longest word in the text.</p>
            <label>Text</label>
            <textarea id="longestInput" oninput="findLongestWord()" placeholder="Type here..."></textarea>
            <div class="result-box">
                <span>Result: <span id="longestResult">-</span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('longestResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Analysis').innerHTML = html;
}

// Character Counter
function countCharacters() {
    const text = document.getElementById('charInput').value;
    document.getElementById('charResult').innerText = text.length;
}

// Line Counter
function countLines() {
    const text = document.getElementById('lineInput').value;
    if (text === "") {
        document.getElementById('lineResult').innerText = 0;
        return;
    }
    const lines = text.split(/\r\n|\r|\n/).length;
    document.getElementById('lineResult').innerText = lines;
}

// Word Counter
function countWords() {
    const text = document.getElementById('wordInput').value.trim();
    if (text === "") {
        document.getElementById('wordResult').innerText = 0;
        return;
    }
    const words = text.split(/\s+/).length;
    document.getElementById('wordResult').innerText = words;
}

// Longest Word
function findLongestWord() {
    const text = document.getElementById('longestInput').value;
    // Remove punctuation for better accuracy
    const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const words = cleanText.split(/\s+/);
    
    let longest = "";
    for (let i = 0; i < words.length; i++) {
        if (words[i].length > longest.length) {
            longest = words[i];
        }
    }
    document.getElementById('longestResult').innerText = longest;
}