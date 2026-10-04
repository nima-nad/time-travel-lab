'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  let year = 2016;
  let selectedCountry = null;
  let travelling = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const countries = window.COUNTRIES;
  const featured = {
    2016: {
    USA: { title: 'The 2016 presidential election', date: '8 November 2016', text: 'The United States held its presidential election on 8 November 2016. Donald Trump won the presidency against Hillary Clinton.', article: '2016 United States presidential election' },
    GBR: { title: 'The Brexit referendum', date: '23 June 2016', text: 'Voters in the United Kingdom chose to leave the European Union in a referendum. The vote began a process that would reshape the country’s relationship with Europe.', article: '2016 United Kingdom European Union membership referendum' },
    BRA: { title: 'Rio welcomes the world', date: '5–21 August 2016', text: 'Rio de Janeiro hosted the Summer Olympics, the first time the Games were held in South America.', article: '2016 Summer Olympics' }
    },
    2006: {
      USA: { title: 'A spacecraft sets off for Pluto', date: '19 January 2006', text: 'At Cape Canaveral in Florida, NASA launched New Horizons on its journey to Pluto and the outer Solar System. The spacecraft would reach Pluto in 2015.', article: 'New Horizons' }
    }
  };
  const aliases = {
    USA: 'the United States', GBR: 'the United Kingdom', NLD: 'the Netherlands',
    PHL: 'the Philippines', ARE: 'the United Arab Emirates', DOM: 'the Dominican Republic',
    CAF: 'the Central African Republic', COD: 'the Democratic Republic of the Congo',
    COG: 'the Republic of the Congo', CZE: 'the Czech Republic', BHS: 'the Bahamas',
    GMB: 'the Gambia', SLB: 'the Solomon Islands', SWZ: 'Swaziland', MKD: 'the Republic of Macedonia',
    TZA: 'Tanzania', SRB: 'Serbia', CPV: 'Cape Verde', VAT: 'Vatican City', HKG: 'Hong Kong', MAC: 'Macau', FSM: 'the Federated States of Micronesia', TLS: 'East Timor', KOR: 'South Korea', PRK: 'North Korea', CIV: 'Ivory Coast'
  };
  let controller = null, requestId = 0;
  const cache = new Map();
  const wikiURL = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  function switchMode(mode) {
    // Stop an in-progress flight before leaving it; its inputs remain available.
    if (!$('flight').hidden) $('skip-flight').click();
    $('destinations').hidden = mode !== 'home';
    $('past').hidden = mode !== 'past';
    $('journey').hidden = mode !== 'future';
    $('science').hidden = mode !== 'future';
    document.body.dataset.mode = mode;
    if (mode !== 'past') resetTrip();
    const target = mode === 'past' ? $('past-title') : mode === 'future' ? $('lab-title') : $('hero-title');
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });

  }
  $('choose-past').addEventListener('click', () => switchMode('past'));
  $('choose-future').addEventListener('click', () => switchMode('future'));
  document.querySelectorAll('.change-direction').forEach((b) => b.addEventListener('click', () => switchMode('home')));
  document.querySelectorAll('a[href="#"], a[href="#destinations"]').forEach((a) => a.addEventListener('click', () => switchMode('home')));
  for (const country of countries) {
    const option = document.createElement('option'); option.value = country.id; option.textContent = country.name;
    $('country-select').append(option);
  }
  $('country-select').addEventListener('change', () => {
    selectCountry($('country-select').value);
  });
  $('world-map').addEventListener('click', (event) => {
    const path = event.target.closest('[data-country]');
    if (path) selectCountry(path.dataset.country);
  });
  $('world-map').addEventListener('pointerover', (event) => {
    const path = event.target.closest('[data-country]');
    if (path) $('map-label').textContent = countries.find((c) => c.id === path.dataset.country).name;
  });
  $('world-map').addEventListener('pointerleave', () => {
    $('map-label').textContent = countries.find((c) => c.id === $('country-select').value)?.name || 'SELECT A COUNTRY';
  });
  function el(tag, text, className) {
    const node = document.createElement(tag); node.textContent = text;
    if (className) node.className = className; return node;
  }
  function link(text, url) {
    const node = el('a', text); node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer'; return node;
  }
  function render(country, result) {
    const card = $('history-card'); card.replaceChildren(); card.removeAttribute('aria-busy');
    card.append(el('p', `${country.name.toUpperCase()} / ${TimeLabel(year)}`, 'eyebrow'));
    card.append(el('h3', result.title));
    if (result.date) card.append(el('p', result.date, 'event-date'));
    card.append(el('p', result.text, 'event-story'));
    if (result.article) {
      card.append(link('Read on Wikipedia ↗', wikiURL(result.article)));
      const attribution = el('p', '', 'source-note');
      if (result.live) {
        attribution.append(document.createTextNode('Excerpt from Wikipedia contributors; citation markers removed and text may be shortened. '));
        attribution.append(link('CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'));
        if (result.revision) attribution.append(document.createTextNode(' · '), link('Source revision', `https://en.wikipedia.org/w/index.php?oldid=${result.revision}`));
      } else if (result.overview) attribution.textContent = 'General reference · not an exact-year event.';
      else attribution.textContent = 'Featured moment · Summary based on the linked Wikipedia article. Available offline; article requires internet.';
      card.append(attribution);
    }
    if (result.retry) {
      const retry = el('button', 'Try Wikipedia again', 'text-button'); retry.type = 'button';
      retry.addEventListener('click', launch); card.append(retry);
    }
    if (result.search) card.append(link(`Search Wikipedia for ${year} in ${country.name} ↗`, `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(`${year} ${country.name} events`)}`));
  }
  async function api(params, signal) {
    const query = new URLSearchParams({ action: 'parse', format: 'json', origin: '*', redirects: '1', ...params });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${query}`, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('network');
    const data = await response.json();
    if (data.error) {
      if (['missingtitle', 'invalidtitle'].includes(data.error.code)) return null;
      throw new Error('api');
    }
    return data.parse;
  }
  async function findEvent(country, year, signal) {
    if (year <= 0) {
      return { title: year < -1000000 ? 'Across geological time' : 'Before the Common Era',
        text: year < -1000000 ? `Your destination is ${TimeLabel(year)}. Earth formed about 4.54 billion years ago. Geological ages are estimates, not exact calendar dates. Country-based event records and modern borders do not apply here. Explore the linked geological timeline for context; this version does not reconstruct the landscape or claim an event for this exact year.` : `Your destination is ${TimeLabel(year)}. This is a global ancient-history stop. Modern countries and borders cannot be projected onto this date. Explore the linked historical overview; a verified event for this exact year is not supplied.`,
        article: year < -1000000 ? 'Geologic_time_scale' : 'Ancient_history', overview: true };
    }
    const names = [...new Set([aliases[country.id] || country.name, country.name])];
    for (const name of names) {
      const page = `${year} in ${name}`;
      const metadata = await api({ page, prop: 'sections' }, signal);
      if (!metadata) continue;
      const section = metadata.sections.find((s) => /^(events|events and (?:developments|incidents)|incumbents and events)$/i.test(s.line));
      if (!section) continue;
      const body = await api({ page: metadata.title, prop: 'text|revid', section: section.index }, signal);
      if (!body?.text?.['*']) continue;
      // Parse as an inert document; never insert Wikipedia HTML into the live page.
      const doc = new DOMParser().parseFromString(body.text['*'], 'text/html');
      doc.querySelectorAll('script,style,table,.mw-editsection,sup,.navbox,.metadata').forEach((n) => n.remove());
      const candidates = [...doc.querySelectorAll('li')].filter((li) => !li.querySelector('li') && li.textContent.trim().length > 45);
      // Prefer major public milestones over routine calendar entries. This is
      // a transparent editorial heuristic, not a historical importance ranking.
      const score = (li) => {
        const text = li.textContent;
        return (/election|referendum|peace agreement|peace treaty|independence|olympic/i.test(text) ? 6 : 0)
          + (/president|prime minister|parliament|earthquake|spacecraft|discovery|championship/i.test(text) ? 3 : 0)
          + (/wins|elected|signed|launch|first|magnitude/i.test(text) ? 2 : 0);
      };
      const event = candidates.sort((a, b) => score(b) - score(a))[0];
      if (!event) continue;
      let text = event.textContent.replace(/\s+/g, ' ').trim();
      const parentEvent = event.parentElement?.closest('li');
      if (parentEvent) {
        const dateNode = parentEvent.cloneNode(true);
        dateNode.querySelectorAll('ul,ol').forEach((node) => node.remove());
        const date = dateNode.textContent.replace(/\s+/g, ' ').trim();
        if (date.length < 70) text = `${date} ${text}`;
      }
      return { title: 'A moment from the year', text: text.length > 750 ? text.slice(0, 750) + '…' : text,
        article: metadata.title, live: true, revision: body.revid, date: `${year} · From Wikipedia’s Events section` };
    }
    return null;
  }

  function resetTrip() {
    controller?.abort(); ++requestId; travelling = false;
    $('past-transit').hidden = true; $('past-arrival').hidden = true;
    $('boarding-pass').hidden = false;
    document.body.classList.remove('past-travelling');
    $('launch-past').disabled = year > 0 && !selectedCountry;
  }
  function updateBoarding(refreshKit = true) {
    const distance = 2026 - year;
    const ancient = year <= 0;
    document.querySelector('.atlas').hidden = ancient;
    document.querySelector('#past .evidence-kit').hidden = ancient;
    const distanceLabel = distance === 0 ? 'Departure year · 2026 archive' : `${distance.toLocaleString('en-US')} ${distance === 1 ? 'year' : 'years'} before departure`;
    $('year-distance').textContent = distance > 1000000 ? 'A journey into Earth’s distant past' : distanceLabel;
    $('chosen-date').textContent = TimeLabel(year);
    $('past-timeline').value = 10000 - Math.round(Math.log1p(2026-year)/Math.log1p(4540000000)*10000);
    $('past-timeline').setAttribute('aria-valuetext', TimeLabel(year));
    if (refreshKit) window.TravellerKit.update(year);
    $('arrival-year').textContent = TimeLabel(year);
    $('map-year').textContent = `ARRIVAL / ${TimeLabel(year)}`;
    $('boarding-title').textContent = (ancient || selectedCountry) ? ancient ? `Earth, ${TimeLabel(year)}` : `${selectedCountry.name}, ${TimeLabel(year)}` : 'Choose your destination.';
    $('boarding-route').textContent = (ancient || selectedCountry)
      ? `Departure: 2026 · Arrival: ${TimeLabel(year)} · ${distanceLabel}. Your destination is locked in.`
      : 'Select a country on the map or in the list to chart your jump.';
    $('launch-past').textContent = (ancient || selectedCountry) ? `Jump to ${TimeLabel(year)}` : 'Choose a country first';
    $('launch-past').disabled = year > 0 && !selectedCountry;
  }
  function syncExact() {
    const input = $('past-year'), mode = $('past-era').value;
    const scale = mode === 'billion' ? 1e9 : mode === 'million' ? 1e6 : 1;
    input.min = ['CE','BCE'].includes(mode) ? '1' : '0';
    input.max = mode === 'CE' ? '2026' : mode === 'BCE' ? '4539997975' : String(4540000000/scale);
    input.step = scale === 1 ? '1' : 'any';
    if(mode === 'CE') input.value = year > 0 ? year : 1;
    else if(mode === 'BCE') input.value = year <= 0 ? 1-year : 1;
    else input.value = (2026-year)/scale;
    $('date-error').textContent = '';
  }
  function setYear() {
    const input = $('past-year'), mode = $('past-era').value;
    const scale = mode === 'billion' ? 1e9 : mode === 'million' ? 1e6 : 1;
    if (!input.checkValidity()) { $('date-error').textContent = `Enter a number between ${input.min} and ${input.max}.`; input.focus(); return; }
    const value = input.valueAsNumber;
    const next = mode === 'CE' ? value : mode === 'BCE' ? 1-value : 2026-Math.round(value*scale);
    if (!Number.isSafeInteger(next) || next < -4539997974 || next > 2026) return;
    year = next; resetTrip(); updateBoarding(); $('date-error').textContent = 'Destination updated.';
  }
  $('apply-date').addEventListener('click', setYear);
  $('past-year').addEventListener('keydown', e => { if(e.key === 'Enter') { e.preventDefault(); setYear(); } });
  $('past-era').addEventListener('change', syncExact);
  $('past-timeline').addEventListener('input', () => {
    const distance = Math.round(Math.expm1((1-Number($('past-timeline').value)/10000)*Math.log1p(4540000000)));
    year = 2026-distance;
    $('past-era').value = year < -1000000000 ? 'billion' : year < -1000000 ? 'million' : year <= 0 ? 'BCE' : 'CE';
    syncExact(); resetTrip(); updateBoarding(false);
  });
  $('past-timeline').addEventListener('change', () => window.TravellerKit.update(year));
  $('past-timeline').value = 10000 - Math.round(Math.log1p(2026-year)/Math.log1p(4540000000)*10000);
  $('past-timeline').setAttribute('aria-valuetext', TimeLabel(year));
  function selectCountry(id) {
    selectedCountry = countries.find((c) => c.id === id) || null;
    resetTrip();
    $('country-select').value = selectedCountry?.id || '';
    $('map-label').textContent = selectedCountry?.name || 'SELECT A COUNTRY';
    document.querySelectorAll('[data-country]').forEach((p) => p.classList.toggle('selected', p.dataset.country === id));
    updateBoarding();
    if (selectedCountry) $('boarding-pass').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
  }
  $('cancel-past').addEventListener('click', () => { resetTrip(); $('launch-past').focus(); });
  $('another-jump').addEventListener('click', () => {
    resetTrip(); $('past-timeline').focus();
    document.querySelector('.jump-years').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  });
  $('launch-past').addEventListener('click', launch);
  async function launch() {
    if ((!selectedCountry && year > 0) || travelling) return;
    resetTrip(); travelling = true;
    const country = year <= 0 ? { id: 'EARTH', name: 'Earth' } : selectedCountry, destinationYear = year;
    const key = `${destinationYear}:${country.id}`;
    const token = ++requestId;
    controller = new AbortController(); const activeController = controller;
    $('launch-past').disabled = true; $('boarding-pass').hidden = true;
    $('past-transit').hidden = false;
    $('transit-route').textContent = `2026 → ${TimeLabel(destinationYear)} / ${country.name}`;
    $('past-transit').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
    $('transit-title').focus({ preventScroll: true });
    document.body.classList.add('past-travelling');
    const timer = setTimeout(() => activeController.abort(), 15000);
    // Start the lookup while the fictional jump plays. Keep errors handled
    // immediately; stale arrivals never replace a newly selected trip.
    const load = (async () => {
      try {
        let result = featured[destinationYear]?.[country.id] || cache.get(key);
        if (!result) result = await findEvent(country, destinationYear, activeController.signal);
        if (result) cache.set(key, result);
        return result || { title: 'This moment is still missing from the archive.', text: `We couldn’t find a usable Events entry for ${country.name} in ${destinationYear}. Explore Wikipedia directly for more coverage.`, search: true };
      } catch {
        return { title: 'Your historical briefing is unavailable.', text: 'Wikipedia could not be reached. Check your connection and try again. The United States has featured moments available offline for 2006 and 2016.', retry: true, search: true };
      } finally { clearTimeout(timer); }
    })();
    const [result] = await Promise.all([load, new Promise((resolve) => setTimeout(resolve, reduced.matches ? 0 : 1800))]);
    if (token !== requestId) return;
    travelling = false; document.body.classList.remove('past-travelling');
    $('past-transit').hidden = true; $('past-arrival').hidden = false;
    $('arrival-title').textContent = `Welcome to ${country.name}, ${TimeLabel(destinationYear)}.`;
    render(country, result);
    $('arrival-title').focus({ preventScroll: true });
    $('past-arrival').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  }
})();
