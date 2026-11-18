# Puzzle Studio

A static commission site for a streamer and digital artist. The site runs with plain HTML, CSS, and JavaScript, so it can be hosted on GitHub Pages or any static host.

## Preview locally

Run `python3 -m http.server 4288` and open `http://localhost:4288`. Open the site through a local server or HTTPS to enable clipboard copying.

## Set rates and profile links

Edit `config.js` to set the currency, commission types, prices, detail levels, and add-ons. The estimator multiplies the base rate and detail surcharge by quantity, then applies selected add-ons once per estimate. The included USD rates are examples. Set `sampleRates` to `false` after confirming the rates.

Set `streamUrl` to the artist's HTTPS channel URL and `contactUrl` to an HTTPS commission form or a `mailto:` address to show the corresponding links. The default text uses Puzzle as the artist name and Puzzle Studio as the site name. The page copy lives in `index.html`.

## Connect Calconic

1. Create or open the commission calculator in Calconic, then activate it.
2. In **Embed Calculator**, choose the **iFrame** option.
3. Copy the iframe's `src` value to `calconic.embedUrl` in `config.js`. It looks like `https://app.calconic.com/api/embed/calculator/CALCULATOR_ID`. Set `calconic.height` to the height in the snippet.
4. Open the site and verify the live calculator on desktop and mobile. Configure the widget's prices and visual styling in Calconic.

A configured widget appears in the commission section. The on-site estimator remains available below the widget as a fallback. Leave the embed URL empty to use the on-site estimator by default.
