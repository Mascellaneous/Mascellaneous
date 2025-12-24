# Math ToolKit

## Project Overview

Math ToolKit is a lightweight, browser-based application designed to perform common mathematical calculations, unit conversions, and statistical analysis instantly. Like its predecessor, it runs entirely on the client side using vanilla JavaScript, HTML, and CSS.

## Design Philosophy

**Real-time Interaction:**  
This project strictly adheres to the "no-click" philosophy. **All tools utilize `oninput` event handlers.** As soon as a user types a number or modifies a field, the results are calculated and displayed immediately. There are no "Calculate" or "Convert" buttons.

**Automated UI Enhancements:**  
To keep the code clean and consistent, **"Copy to Clipboard" buttons are not hardcoded in the HTML.** Instead, they are generated automatically by the application logic and appended to result fields at runtime.

## Features & Tabs

The application is organized into six main tabs:

### 1. Arithmetic
Performs simultaneous basic operations (addition, subtraction, multiplication, division) and exponentiation on input pairs.

### 2. Geometry
Calculates properties of shapes, such as the area and circumference of circles, or the perimeter and area of rectangles, based on dimension inputs.

### 3. Statistics
Analyzes lists of numbers (entered via textarea) to determine the Sum, Average (Mean), Minimum, and Maximum values.

### 4. Units
Dedicated to converting measurements, specifically Temperature (Celsius/Fahrenheit) and Distance (Metric/Imperial).

### 5. Finance
Practical tools for everyday money math, including a Discount Calculator and a Tip Calculator.

### 6. Time & Date
Utilities for temporal calculations, including Time Difference, Date Difference, Unix Timestamp conversion, and Age Calculation.

## Technical Structure

*   `index.html`: Main shell.
*   `styles.css`: Shared styling.
*   `main.js`: Tab logic and global event handling.
*   `global-utils.js`: Contains shared utilities. Specifically, this file includes the `addCopyButtons` function, which automatically injects copy buttons into any element with the `.result-box` class.
*   `arithmetic.js`: Renders Arithmetic tab.
*   `geometry.js`: Renders Geometry tab.
*   `statistics.js`: Renders Statistics tab.
*   `units.js`: Renders Units tab.
*   `finance.js`: Renders Finance tab.
*   `time_date.js`: Renders Time & Date tab.

## Setup

Simply open `index.html` in any modern web browser.