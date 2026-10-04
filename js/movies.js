'use strict';
(() => {
  const cache = new Map();
  let active = null, sequence = 0;
  async function television(year, signal) {
    const curated = {
      2003: [['Friends — Season 10 (final season)', '2003-09-25', 'Friends_season_10', 'Season premiere']],
      2004: [['Friends — Season 10 (final season)', '2004-05-06', 'Friends_season_10', 'Series finale']],
      2005: [['The Office (US) — Season 2', '2005-09-20', 'The_Office_(American_TV_series)_season_2', 'Season premiere']],
      2006: [['The Office (US) — Season 2', '2006-05-11', 'The_Office_(American_TV_series)_season_2', 'Season finale']],
      2025: [['Severance — Season 2', '2025-01-17', 'Severance_(TV_series)', 'Season premiere']]
    };
    function entry(title, iso, article, kind) {
      const date = new Date(iso+'T12:00:00');
      return {title, path:'/wiki/'+encodeURIComponent(article),date:date.getTime(),label:date.toLocaleDateString('en-GB',{day:'numeric',month:'long'})+' · '+kind,tv:true};
    }
    if (curated[year]) return curated[year].map(row=>entry(...row));
    if (year < 1950) return [];
    async function api(params) {
      const query = new URLSearchParams({format:'json',origin:'*',...params});
      const response = await fetch('https://en.wikipedia.org/w/api.php?'+query,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok) throw new Error('TV unavailable');
      return response.json();
    }
    try {
      const category = await api({action:'query',list:'categorymembers',cmtitle:`Category:${year} American television seasons`,cmnamespace:'0',cmlimit:'15'});
      const candidates = (category.query?.categorymembers || []).filter(p=>/season \d+/i.test(p.title)).slice(0,4);
      const entries = await Promise.all(candidates.map(async p=>{
        try {
          const data = await api({action:'parse',page:p.title,prop:'text',redirects:'1'});
          if(!data.parse?.text?.['*']) return null;
          const doc = new DOMParser().parseFromString(data.parse.text['*'],'text/html');
          const dates = [...doc.querySelectorAll('.infobox .bday,.infobox .dtstart,.infobox .dtend')].map(n=>n.textContent.trim()).filter(d=>/^\d{4}-\d\d-\d\d$/.test(d));
          const iso = dates.find(d=>Number(d.slice(0,4))===year && new Date(d)<=new Date());
          if(!iso) return null;
          return entry(p.title,iso,p.title,iso===dates[0]?'Season premiere':'Season finale');
        } catch { return null; }
      }));
      return entries.filter(Boolean).slice(0,2);
    } catch { return []; }
  }

  async function update(year) {
    const box = document.getElementById('movie-spoilers');
    const list = document.getElementById('movie-titles');
    const status = document.getElementById('movie-status');
    document.getElementById('movie-year').textContent = `MOVIES / SERIES / ${TimeLabel(year)} · U.S. RELEASES`;
    active?.abort(); const controller = new AbortController(); active = controller;
    const token = ++sequence;
    list.replaceChildren(); status.textContent = ''; box.removeAttribute('aria-busy');
    if (year < 1888) { status.textContent = 'No movies or television series existed in this year.'; return; }
    box.setAttribute('aria-busy', 'true'); status.textContent = 'Finding titles…';
    const timer = setTimeout(() => controller.abort(), 12000);
    const tvPromise = television(year, controller.signal);
    try {
      let titles = cache.get(year);
      if (!titles) {
        const params = new URLSearchParams({action:'parse',page:`List of American films of ${year}`,prop:'text',format:'json',origin:'*'});
        const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if (!response.ok) throw new Error('Unavailable');
        const data = await response.json();
        if (data.error?.code === 'missingtitle') titles = [];
        else {
          if (data.error || !data.parse?.text?.['*']) throw new Error('Unavailable');
          const doc = new DOMParser().parseFromString(data.parse.text['*'],'text/html');
          const films = [], seen = new Set();
          const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
          for (const table of doc.querySelectorAll('table.wikitable')) {
            const header = table.querySelector('tr');
            if (!header || !/Opening/.test(header.textContent) || !/Title/.test(header.textContent)) continue;
            const rows = [...table.querySelectorAll('tr')];
            const grid = [];
            rows.forEach((row, ri) => {
              grid[ri] ||= []; let col = 0;
              for (const cell of row.children) {
                if (!['TD','TH'].includes(cell.tagName)) continue;
                while (grid[ri][col]) col++;
                const rs = Math.min(Number(cell.getAttribute('rowspan')) || 1, rows.length);
                const cs = Math.min(Number(cell.getAttribute('colspan')) || 1, 10);
                for (let dr=0; dr<rs; dr++) for(let dc=0; dc<cs; dc++) {
                  grid[ri+dr] ||= []; grid[ri+dr][col+dc] = cell;
                }
                col += cs;
              }
            });
            for (const cells of grid.slice(1)) {
              const month = months.indexOf(cells[0]?.textContent.replace(/[^a-z]/gi,'').toUpperCase());
              const day = Number(cells[1]?.textContent.trim());
              const anchor = cells[2]?.querySelector('i a[href^="/wiki/"]') || cells[2]?.querySelector('a[href^="/wiki/"]');
              if (month < 0 || !Number.isInteger(day) || day < 1 || day > 31 || !anchor) continue;
              const title = anchor.textContent.trim(), date = new Date(year,month,day);
              if (date.getMonth() !== month || date > new Date() || seen.has(title)) continue;
              seen.add(title);
              films.push({title, path:anchor.getAttribute('href'), date:date.getTime(), label:`${day} ${months[month].slice(0,1)+months[month].slice(1).toLowerCase()}`});
            }
          }
          // Pick distinct releases near five points across the calendar year.
          const remaining = films.slice(); titles = [];
          for (const dayOfYear of [15,90,180,270,350]) {
            if (!remaining.length) break;
            const target = new Date(year,0,dayOfYear).getTime();
            remaining.sort((a,b)=>Math.abs(a.date-target)-Math.abs(b.date-target));
            titles.push(remaining.shift());
          }
          titles.sort((a,b)=>a.date-b.date);
        }
        const series = await tvPromise;
        for (const show of series) {
          if (titles.length < 5) titles.push(show);
          else {
            const replaceable = titles.map((film,index)=>({film,index})).filter(x=>!x.film.tv);
            replaceable.sort((a,b)=>Math.abs(a.film.date-show.date)-Math.abs(b.film.date-show.date));
            if(replaceable.length) titles[replaceable[0].index] = show;
          }
        }
        titles.sort((a,b)=>a.date-b.date);
        cache.set(year,titles);
      }
      if (token !== sequence) return;
      for (const film of titles) {
        const item = document.createElement('li'), link = document.createElement('a');
        link.textContent = film.title;
        link.href = `https://en.wikipedia.org${film.path}`;
        link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); const date = document.createElement('span'); date.className = 'release-date'; date.textContent = film.label; item.append(date); list.append(item);
      }
      status.textContent = titles.length === 5 ? '' : titles.length ? 'Fewer than five dated releases are available.' : 'No dated releases found for this year.';
    } catch {
      if (token !== sequence) return;
      status.textContent = 'Titles are unavailable. ';
      const retry = document.createElement('button'); retry.type='button'; retry.className='text-button'; retry.textContent='Try again'; retry.addEventListener('click',()=>update(year)); status.append(retry);
    } finally {
      clearTimeout(timer);
      if (token === sequence) box.removeAttribute('aria-busy');
    }
  }
  window.MovieKit = {update};
})();
