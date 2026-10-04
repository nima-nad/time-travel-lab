'use strict';
(() => {
  function updateDate() {
    const now = new Date();
    const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const iso = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    document.querySelectorAll('.departure-date').forEach((node) => { node.textContent = date; node.dateTime = iso; });
  }
  const discoveries = [
    { before: 1799, title: 'The Rosetta Stone', place: 'Rashid (Rosetta), Egypt', text: 'Rediscovered in 1799. In this imagined journey, you could point researchers toward the stone before that recorded rediscovery—not claim to be the first person ever to know it existed.', source: 'https://www.britishmuseum.org/collection/object/Y_EA24' },
    { before: 1939, title: 'The Sutton Hoo ship burial', place: 'Suffolk, England', text: 'The famous ship burial was excavated in 1939. You could predict that discovery before its recorded excavation and invite qualified researchers to investigate.', source: 'https://www.britishmuseum.org/collection/death-and-memory/anglo-saxon-ship-burial-sutton-hoo' },
    { before: 2022, title: 'The wreck of Endurance', place: 'Weddell Sea, Antarctica', text: 'The ship sank in 1915; its wreck was located on 5 March 2022. You could predict the wreck’s eventual discovery before the search team found it. This would require a specialist expedition, not a solo treasure hunt.', source: 'https://endurance22.org/expedition-blog/9-march-2022' }
  ];
  function update(year) {
    window.MovieKit.update(year);
    const target = document.getElementById('discovery-lead'); target.replaceChildren();
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = `YOUR HISTORICAL LEAD / ${TimeLabel(year)}`; target.append(label);
    // Year-only arrivals exclude the entire discovery year to avoid promising
    // an object is undiscovered when the day of arrival is unknown.
    const matches = discoveries.filter((d) => year < d.before).slice(0, 2);
    label.textContent = `YOUR HISTORICAL ${matches.length === 2 ? 'LEADS' : 'LEAD'} / ${TimeLabel(year)}`;
    const found = matches[0];
    const title = document.createElement('h4');
    const description = document.createElement('p');
    if (!found) {
      title.textContent = 'No verified undiscovered find in this kit for that year.';
      description.textContent = 'Our sourced examples were already discovered by your selected year. Try an earlier year for a discovery lead, or use the newspaper and time-capsule ideas. We won’t invent a future discovery.';
      target.append(title, description); return;
    }
    for (const found of matches) {
      const entry = document.createElement('div'); entry.className = 'historical-entry';
      const title = document.createElement('h4'); title.textContent = found.title;
      const description = document.createElement('p'); description.textContent = found.text;
      const location = document.createElement('p'); location.className = 'kit-note'; location.textContent = `${found.place} · Worldwide example, not necessarily in your selected country.`;
      const source = document.createElement('a'); source.href = found.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = 'Check the discovery record';
      entry.append(title, location, description, source); target.append(entry);
    }
    const care = document.createElement('p'); care.className = 'kit-note'; care.textContent = 'Think “help document a discovery,” not “take the artefact.” Respect local knowledge and preserve the site.';
    target.append(care);
  }
  window.TravellerKit = { update };
  updateDate(); update(2016);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDate(); });
  setInterval(updateDate, 60000);
})();
