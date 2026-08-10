


### 3. Detailed Guide: How to Change Bus Routes and Stations

Because the application is built **dynamically**, you do not need to manually code the API IDs for every bus station. The application queries the KMB server to pull the stations automatically.

Here is how you can customize the application for different routes.

#### A. Adding or Changing Routes

Look for the `<script>` section inside the HTML code. Near the very top of the JavaScript, you will find a configuration array:

```javascript
// 1. CONFIGURATION: Define your routes here
const CONFIG_ROUTES = ['98A', '98C'];

```

To add more buses (for example, `1A`, `296A`, and `98`), simply add them to this list separated by commas and enclosed in single quotes:

```javascript
const CONFIG_ROUTES = ['98A', '98C', '1A', '296A', '98'];

```

Save the file and refresh your browser. The "Route" dropdown will immediately populate with the new buses, and the app will automatically handle fetching the correct stations for them!

#### B. Changing the Default Direction

The application defaults to "Outbound" (去程). If you want it to default to "Inbound" (回程), locate this block of HTML:

```html
<select id="direction">
    <option value="outbound">去程 (Outbound)</option>
    <option value="inbound">回程 (Inbound)</option>
</select>

```

Simply move the `selected` attribute to the inbound option:

```html
<select id="direction">
    <option value="inbound" selected>回程 (Inbound)</option>
    <option value="outbound">去程 (Outbound)</option>
</select>

```

#### C. Hardcoding a Fixed Station (Advanced)

If you are building a dashboard for a display in a lobby and **only** want to see the ETA for one specific station (without dropdown menus), you can bypass the UI entirely.

1. First, use the dropdown app to find your bus stop and right-click -> "Inspect Element" to see the `value` of the stop (e.g., `42247F818EC13CC9`).
2. Replace the `getETA()` function call with a direct fetch.

Modify the script to execute this automatically on a timer:

```javascript
// Replace 42247F818EC13CC9 with your actual stop ID
const MY_STOP_ID = '42247F818EC13CC9';
const MY_ROUTE = '98A';

async function fetchMyFixedETA() {
    const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${MY_STOP_ID}/${MY_ROUTE}/1`);
    const json = await response.json();
    
    // Log or render json.data here
    console.log(json.data);
}

// Auto-refresh every 60 seconds
setInterval(fetchMyFixedETA, 60000);
fetchMyFixedETA();

```