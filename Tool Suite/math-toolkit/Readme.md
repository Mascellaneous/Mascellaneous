\# Math ToolKit



\## Project Overview



Math ToolKit is a lightweight, browser-based application designed to perform common mathematical calculations, unit conversions, and statistical analysis instantly. Like its predecessor, it runs entirely on the client side using vanilla JavaScript, HTML, and CSS.



\## Design Philosophy



\*\*Real-time Interaction:\*\*  

This project strictly adheres to the "no-click" philosophy. \*\*All tools utilize `oninput` event handlers.\*\* As soon as a user types a number or modifies a field, the results are calculated and displayed immediately. There are no "Calculate" or "Convert" buttons.



\## Features \& Tabs



The application is organized into five main tabs:



\### 1. Arithmetic

Performs simultaneous basic operations (addition, subtraction, multiplication, division) and exponentiation on input pairs.



\### 2. Geometry

Calculates properties of shapes, such as the area and circumference of circles, or the perimeter and area of rectangles, based on dimension inputs.



\### 3. Statistics

Analyzes lists of numbers (entered via textarea) to determine the Sum, Average (Mean), Minimum, and Maximum values.



\### 4. Units

Dedicated to converting measurements, specifically Temperature (Celsius/Fahrenheit) and Distance (Metric/Imperial).



\### 5. Finance

Practical tools for everyday money math, including a Discount Calculator and a Tip Calculator.



\## Technical Structure



\*   `index.html`: Main shell.

\*   `styles.css`: Shared styling.

\*   `main.js`: Tab logic and clipboard functions.

\*   `arithmetic.js`: Renders Arithmetic tab.

\*   `geometry.js`: Renders Geometry tab.

\*   `statistics.js`: Renders Statistics tab.

\*   `units.js`: Renders Units tab.

\*   `finance.js`: Renders Finance tab.



\## Setup



Simply open `index.html` in any modern web browser.

