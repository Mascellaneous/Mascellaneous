/**
 * Dependencies: None
 * Contains functions for text casing and formatting conversions.
 * Renders the Formatting tab content.
 */

function renderFormatting() {
    const html = `
        <!-- Lowercase -->
        <div class="tool-card">
            <h3>Convert to Lowercase</h3>
            <p class="desc">Changes all letters to small letters. Ex: "Hello WORLD" → "hello world"</p>
            <label>Input Text</label>
            <input type="text" id="lowerInput" oninput="toLower()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="lowerResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('lowerResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Uppercase -->
        <div class="tool-card">
            <h3>Convert to Uppercase</h3>
            <p class="desc">Changes all letters to capital letters. Ex: "hello world" → "HELLO WORLD"</p>
            <label>Input Text</label>
            <input type="text" id="upperInput" oninput="toUpper()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="upperResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('upperResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Title Case -->
        <div class="tool-card">
            <h3>Convert to Title Case</h3>
            <p class="desc">Capitalizes the first letter of every word. Ex: "the quick brown fox" → "The Quick Brown Fox"</p>
            <label>Input Text</label>
            <input type="text" id="titleInput" oninput="toTitle()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="titleResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('titleResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Sentence Case -->
        <div class="tool-card">
            <h3>Convert to Sentence Case</h3>
            <p class="desc">Capitalizes only the first letter of the sentence. Ex: "hello there. how are you?" → "Hello there. how are you?"</p>
            <label>Input Text</label>
            <input type="text" id="sentenceInput" oninput="toSentence()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="sentenceResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('sentenceResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Kebab Case -->
        <div class="tool-card">
            <h3>Convert to Kebab Case</h3>
            <p class="desc">Lowercases text and replaces spaces with hyphens. Ex: "Hello World Code" → "hello-world-code"</p>
            <label>Input Text</label>
            <input type="text" id="kebabInput" oninput="toKebab()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="kebabResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('kebabResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>

        <!-- Snake Case -->
        <div class="tool-card">
            <h3>Convert to Snake Case</h3>
            <p class="desc">Lowercases text and replaces spaces with underscores. Ex: "Hello World Code" → "hello_world_code"</p>
            <label>Input Text</label>
            <input type="text" id="snakeInput" oninput="toSnake()" placeholder="Type here...">
            <div class="result-box">
                <span>Result: <span id="snakeResult"></span></span>
                <button class="copy-btn" onclick="copyToClipboard(document.getElementById('snakeResult').innerText, this)" title="Copy">📋</button>
            </div>
        </div>
    `;
    document.getElementById('Formatting').innerHTML = html;
}

// Convert to Lowercase
function toLower() {
    const text = document.getElementById('lowerInput').value;
    document.getElementById('lowerResult').innerText = text.toLowerCase();
}

// Convert to Uppercase
function toUpper() {
    const text = document.getElementById('upperInput').value;
    document.getElementById('upperResult').innerText = text.toUpperCase();
}

// Convert to Title Case
function toTitle() {
    const text = document.getElementById('titleInput').value;
    const result = text.toLowerCase().replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
    document.getElementById('titleResult').innerText = result;
}

// Convert to Sentence Case
function toSentence() {
    const text = document.getElementById('sentenceInput').value;
    if (!text) {
        document.getElementById('sentenceResult').innerText = "";
        return;
    }
    const result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    document.getElementById('sentenceResult').innerText = result;
}

// Convert to Kebab Case
function toKebab() {
    const text = document.getElementById('kebabInput').value;
    const result = text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-'); 
    document.getElementById('kebabResult').innerText = result;
}

// Convert to Snake Case
function toSnake() {
    const text = document.getElementById('snakeInput').value;
    const result = text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
    document.getElementById('snakeResult').innerText = result;
}