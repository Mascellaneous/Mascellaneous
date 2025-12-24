/**
 * Scans a container for elements with class 'result-box'
 * and appends a copy button if one doesn't exist.
 * 
 * @param {HTMLElement} container - The DOM element to search within
 */
function addCopyButtons(container) {
    if (!container) return;

    const boxes = container.querySelectorAll('.result-box');
    
    boxes.forEach(box => {
        // Check if button already exists to prevent duplicates
        if (box.querySelector('.copy-btn')) return;

        // Find the span that holds the value (assuming structure: <span>Label: <span id="val">0</span></span>)
        // We look for the nested span with an ID or the last span child
        const valueSpan = box.querySelector('span > span') || box.querySelector('span:last-child');
        
        if (valueSpan) {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.innerHTML = '📋';
            btn.title = 'Copy';
            btn.onclick = function() {
                // We grab the text from the specific value span we found earlier
                copyToClipboard(valueSpan.innerText, btn);
            };
            box.appendChild(btn);
        }
    });
}