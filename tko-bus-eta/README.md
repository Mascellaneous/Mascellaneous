
# KMB ETA Web Application

A lightweight, single-page web application to track the Estimated Time of Arrival (ETA) for Kowloon Motor Bus (KMB) routes. By default, it is configured for routes **98A** and **98C**.

## 🚀 Features
* **Zero Dependencies:** Built entirely with plain HTML, CSS, and Vanilla JavaScript. No React, Node.js, or backend servers required.
* **Real-Time Data:** Connects directly to the official Hong Kong Government `Data.gov.hk` KMB Open API.
* **Responsive Design:** Mobile-friendly UI layout for checking bus times on the go.
* **Dynamic Loading:** Automatically fetches bus stops and bounds based on the selected route.

## 🛠️ How the Code Works

1. **Initialization (`init`):** 
   When the page loads, the app makes an API call to `/v1/transport/kmb/stop`. This downloads a master list of all bus stops in Hong Kong so we can translate random API `stop_id`s (e.g., `15406C62C0EB6317`) into human-readable Chinese names (e.g., "坑口站").
2. **Dynamic Stop Listing (`updateStops`):**
   When you select a Route and Direction, the app queries `/v1/transport/kmb/route-stop/...` to get the sequence of stops for that specific journey. It populates the dropdown menu dynamically.
3. **Fetching ETA (`getETA`):**
   Upon clicking the search button, the app queries the endpoint `/v1/transport/kmb/eta/{stop_id}/{route}/1`. It filters out the wrong directions and formats the ISO timestamps into a localized, user-friendly 12/24-hour format.

## 💻 How to Run
1. Save the code in a file named `index.html`.
2. Double-click the file to open it in any modern web browser.
3. (Optional) Host it on free platforms like GitHub Pages, Vercel, or Netlify to access it from anywhere.

