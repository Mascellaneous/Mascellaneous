# Text Processor Tools

## Project Overview

Text Processor Tools is a lightweight, browser-based application designed to help users analyze, modify, search, and format text data efficiently. It runs entirely on the client side using vanilla JavaScript, HTML, and CSS, ensuring privacy and speed without the need for server-side processing.

## Design Philosophy

**Real-time Interaction:**  
To enhance user efficiency, this project prioritizes immediate feedback. **Tools should utilize `oninput` event handlers** to process text immediately as the user types or adjusts settings. This eliminates the need for manual "Apply," "Convert," or "Submit" buttons wherever possible, providing a seamless and reactive user experience across the entire application.

## Features & Tabs

The application is organized into five main tabs, each dedicated to a specific category of text manipulation:

### 1. Analysis
Focuses on gathering metrics about the input text to quantify the content, such as counting characters, words, and lines.

### 2. Search & Extract
Allows users to locate specific data indices within a text block or isolate specific segments based on position or pattern (e.g., extracting emails).

### 3. Modification
Contains tools that structurally change the text content or arrangement, such as sorting lines, removing duplicates, removing spaces, or reversing text.

### 4. Formatting
Handles casing and stylistic transformations to standardize the visual presentation of the text (e.g., converting to uppercase, title case, or snake_case).

### 5. Encoding
Dedicated to converting text between different formats for transmission or obfuscation, including Base64, URL encoding, and ROT13.

## Technical Structure

The project utilizes a modular architecture. `index.html` acts as the main shell, while the HTML content for each tab is dynamically rendered via dedicated JavaScript files:

*   `analysis.js`: Renders the Analysis tab.
*   `search-extract.js`: Renders the Search & Extract tab.
*   `modification.js`: Renders the Modification tab.
*   `formatting.js`: Renders the Formatting tab.
*   `encoding.js`: Renders the Encoding tab.

## Setup

Simply open `index.html` in any modern web browser to start using the tools. No installation or dependencies are required.