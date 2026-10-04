# Time Travel Lab

A cinematic two-way journey through time, built with vanilla HTML, CSS, and JavaScript. No build step, package dependencies, backend, accounts, API keys, cookies, analytics, or persistent visitor storage.

## Open it

Open `index.html` in a modern browser, or run `python3 -m http.server 8000` from this folder and visit http://localhost:8000. The map and future simulator work offline. Most history lookups need internet access to Wikipedia.

## Two journeys

**Future:** configure Earth years and speed → launch → compare clocks → Try Again. Presets cover 50%, 90%, 99%, 99.9%, and 99.99% of light speed. The slider supports 0–99.99%; Earth time supports 0.01–10,000 years. A 4.5-second starfield illustration accompanies the calculation. Skip animation and system reduced-motion support are included.

**Past:** enter a CE year, BCE year, or years before 2026, back to Earth’s approximate formation 4.54 billion years ago, then a destination on the map or in the keyboard-accessible selector. Review the boarding pass, launch a jump, and arrive at a Wikipedia-backed historical moment. This edition departs from 2026 and covers the entire selected calendar year rather than an exact date. A short fictional transit animation supports cancellation and reduced-motion preferences. Changing country or year cancels pending work so an old result cannot replace the new trip. The map has 241 country/territory/disputed-area entries from Natural Earth, excluding Antarctica. Small islands can be selected from the list. Dataset boundaries are present-day, not a reconstruction of the selected year.

The US, UK, and Brazil have locally bundled featured moments for 2016; the US also has a 2006 New Horizons launch story linked to [Wikipedia](https://en.wikipedia.org/wiki/New_Horizons). Other destinations request their English Wikipedia selected country-by-year Events section through the public Action API. A simple keyword heuristic prioritises elections, referendums, treaties and other public milestones; this is not an authoritative ranking of historical importance. Some places lack suitable pages or Events sections: the interface provides an honest unavailable state and a Wikipedia search link instead of inventing an event. Network failures show retry controls. Requests time out after 15 seconds, outdated requests are cancelled, and successfully loaded events are cached only in memory, keyed by country and year.

There is no experimentally established method for travelling into the past. Past mode is a historical explorer, with a separate explanatory notice. Future mode retains its educational disclaimer and formula reference.

Both journeys include interactive packing checklists under “Prove you’re a time traveller.” These are imaginative evidence kits, not actual scientific verification. No uploads or persistent storage are used. Newspaper dates reflect the visitor’s local current date, refreshed while the page is open. Past discovery leads depend on the selected year and link to museum or expedition sources. They are worldwide examples, explicitly not country-specific; the full discovery year is excluded because no exact arrival day is selected. Recent years with no eligible sourced example show an honest fallback. Future kits include a phone, offline media, charger, paper backups, and pre-departure records.

## Sources and attribution

- Physics: [OpenStax, University Physics Volume 3, §5.3](https://openstax.org/books/university-physics-volume-3/pages/5-3-time-dilation).
- Map: [Natural Earth, 1:50m country boundaries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Geometry is projected and rounded for an inline SVG; names/areas follow the dataset, including disputed regions.
- Featured history: [2016 US presidential election](https://en.wikipedia.org/wiki/2016_United_States_presidential_election), [UK EU referendum](https://en.wikipedia.org/wiki/2016_United_Kingdom_European_Union_membership_referendum), [Rio Olympics](https://en.wikipedia.org/wiki/2016_Summer_Olympics).
- Live excerpts: Wikipedia contributors, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each loaded entry links its source article and source revision when provided. Citation markers are removed and long excerpts are shortened. Wikipedia HTML is parsed in an inert document and displayed only as plain text, never inserted into the live page.

## Privacy

Future calculations and the bundled map run locally. Selecting a destination without a bundled story sends that country/year request to Wikimedia, which receives ordinary connection information. Fetch uses no credentials or referrer. Opening an external reference navigates to that provider. Hosting providers may maintain access logs. This project does not collect or store visitor information itself.

## Physics model

beta = v/c; gamma = 1/sqrt(1-beta²); traveller time = Earth time/gamma. The implementation evaluates sqrt((1-beta)(1+beta)) for numerical stability. c = 299,792.458 km/s.

An idealised out-and-back journey uses equal constant speeds on both legs in the Earth frame, neglecting acceleration/turnaround durations, gravity, and Earth's motion. This is not a propulsion or mission-planning simulator. Animation timing is illustrative and displayed numbers are rounded.

## Files

- `index.html`: entrance, inline map, journey stages, explanatory text
- `styles.css`: responsive design and motion preferences
- `js/physics.js`: validated pure calculations
- `js/app.js`: future simulator and starfield
- `js/countries.js`: map destination names and identifiers
- `js/past.js`: navigation, featured stories, Wikipedia integration
- `tests/physics.test.cjs`: dependency-free numerical tests
- `favicon.svg`, `.nojekyll`: static hosting assets

## Verify

Run `node --test tests/physics.test.cjs` with Node.js. All nine numerical tests pass. Browser checks during V2 covered the two-way entrance, live Australian Wikipedia lookup, US featured story, speed preset activation by keyboard, launch to result, and Try Again. The narrow viewport map and controls were visually inspected. Wikipedia coverage is not exhaustive, and availability depends on the external service.

## Publish with GitHub Pages

1. Create a repository named `relativity-lab`.
2. Upload this folder's contents to the repository root, preserving `js/` and `tests/`.
3. Under Settings → Pages, select Deploy from a branch, your main branch, and `/ (root)`.
4. Open the URL GitHub provides once deployment completes.

All project assets use relative paths; no custom domain or build configuration is required. The project has not been published automatically.

Year coverage: all integer years 1000–2026 are selectable, inclusive. The departure year remains fixed at 2026; selecting 2026 explores that year without claiming a backward jump. Wikipedia coverage and historical country names vary; unavailable entries use the existing search fallback. The 2026 archive may contain ongoing or scheduled events.

Evidence-kit sources: British Museum records for the Rosetta Stone (1799) and Sutton Hoo (1939); Endurance22 expedition blog, 9 March 2022, reporting discovery on 5 March 2022. Browser checks covered eligible and ineligible years, the live departure date, and keyboard checklist toggling.

Past kit additions: display up to two eligible sourced historical leads; otherwise one or the existing unavailable message. Below them, five movie titles are selected from Wikipedia’s List of American films for the arrival year, near January, March, June, September and December. Dates are the listed US release dates, not necessarily worldwide premieres or releases in the chosen destination. No plots are displayed. Future-dated releases are excluded. Unsupported early-year table formats or incomplete data yield fewer/no titles rather than invented dates. Movie lookups use Wikimedia, no credentials, and an in-memory year cache.

Brand updated to Time Travel Lab. Past checklist item 5 introduces movie/TV-season spoilers. The five-title list now mixes films with sourced television-season premiere/finale dates when available. Curated examples include Friends season 10 (2003 premiere / 2004 finale), The Office US season 2 (2005 premiere / 2006 finale), and Severance season 2 (2025 premiere). Other years query Wikipedia television-season categories and infobox dates; absent TV data leaves film results intact. No plots are revealed.

Deep-time update: the dropdown has been replaced by validated integer inputs and CE/BCE/years-ago units, plus an Earth-formation shortcut. The lower boundary represents an approximate geological age, not an exact formation date. Internally astronomical year zero is 1 BCE; the interface has no CE/BCE year zero. BCE arrivals use a global reference and hide the modern map and human evidence kit. No exact-year prehistoric event or reconstructed landscape is claimed. Earth-age reference: https://pubs.usgs.gov/gip/geotime/age.html .

Simplified date picker: six one-click destinations plus a readable selected-date preview. “Choose another year” reveals optional exact entry, including million/billion-year units (e.g. 4.54 rather than a ten-digit number). Edits apply only on Set destination or Enter; invalid drafts leave the previous destination intact. Presets synchronise the exact-date controls.

Current picker: presets removed. Always-visible timeline plus exact date/unit entry support the entire range. The slider is logarithmic to make recent and deep history usable on one track; it samples the range, while exact entry supports every integer year. Browser-verified formation and 2026 endpoints and arbitrary year 1847.
