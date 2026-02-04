import os
import json

# Configuration
IGNORE_DIRS = {'.git', '__pycache__'}
IGNORE_FILES = {'index.html', 'generate_index.py', 'data.json', 'generate_data.py'}

# This is the HTML template. We will inject the data into the variable __JSON_DATA__
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DSE Question Bank</title>
    <style>
        :root { --primary: #2563eb; --bg: #f8fafc; --text: #1e293b; --border: #e2e8f0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        header { text-align: center; margin-bottom: 30px; }
        .search-box { width: 100%; max-width: 500px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        .card-header { background: var(--primary); color: white; padding: 10px 15px; font-weight: bold; display: flex; justify-content: space-between; }
        .file-list { list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto; }
        .file-list li a { display: block; padding: 10px 15px; text-decoration: none; color: var(--text); border-bottom: 1px solid var(--border); }
        .file-list li a:hover { background: #eff6ff; color: var(--primary); padding-left: 20px; transition: 0.2s; }
    </style>
</head>
<body>
<div class="container">
    <header>
        <h1 style="color: var(--primary)">DSE Question Bank</h1>
        <input type="text" id="search" class="search-box" placeholder="Search year or question...">
    </header>
    <div id="grid" class="grid"></div>
</div>

<script>
    // DATA IS INJECTED HERE BY PYTHON
    const db = __JSON_DATA__;

    const grid = document.getElementById('grid');
    const search = document.getElementById('search');

    function render(filter = '') {
        grid.innerHTML = '';
        const term = filter.toLowerCase();
        
        for (const [year, files] of Object.entries(db)) {
            // Filter logic
            const matches = files.filter(f => f.toLowerCase().includes(term) || year.includes(term));
            
            if (matches.length > 0) {
                const card = document.createElement('div');
                card.className = 'card';
                
                let listHtml = '';
                matches.forEach(f => {
                    // Link construction
                    listHtml += `<li><a href="./${year}/${f}" target="_blank">${f.replace('.html','')}</a></li>`;
                });

                card.innerHTML = `
                    <div class="card-header">
                        <span>${year}</span>
                        <span style="font-size:0.8em; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px">${matches.length}</span>
                    </div>
                    <ul class="file-list">${listHtml}</ul>
                `;
                grid.appendChild(card);
            }
        }
    }

    // Initial render
    render();
    
    // Search listener
    search.addEventListener('input', (e) => render(e.target.value));
</script>
</body>
</html>
"""

def generate_site():
    data = {}
    root_dir = os.getcwd()
    
    # 1. Scan the folders (Same logic as your original script)
    for item in os.listdir(root_dir):
        if os.path.isdir(item) and item not in IGNORE_DIRS:
            folder_name = item
            html_files = []
            try:
                for file in os.listdir(os.path.join(root_dir, folder_name)):
                    if file.endswith('.html') and file not in IGNORE_FILES:
                        html_files.append(file)
            except OSError:
                continue

            if html_files:
                html_files.sort()
                data[folder_name] = html_files

    # 2. Sort the data
    sorted_data = dict(sorted(data.items()))

    # 3. Inject JSON directly into HTML string
    # This replaces the placeholder __JSON_DATA__ with the actual JSON text
    json_string = json.dumps(sorted_data)
    final_html = HTML_TEMPLATE.replace('__JSON_DATA__', json_string)

    # 4. Write the index.html file
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(final_html)
        print(f"Success! Generated index.html with {len(sorted_data)} folders.")
        print("You can now double-click index.html to open it.")

if __name__ == "__main__":
    generate_site()