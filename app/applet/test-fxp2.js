const { XMLParser } = require('fast-xml-parser');

const parseEPG = (xml) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    isArray: (name, jpath, isLeafNode, isAttribute) => { 
      const alwaysArray = ['channel', 'programme', 'title', 'desc', 'category', 'icon', 'rating', 'episode-num', 'sub-title', 'actor', 'director', 'writer', 'adapter', 'producer', 'composer', 'editor', 'presenter', 'commentator', 'guest'];
      if(alwaysArray.indexOf(name) !== -1) return true;
      return false;
    }
  });

  const parsed = parser.parse(xml);
  const tv = parsed.tv || {};
  
  const channels = (tv.channel || []).map((c) => ({
    id: c['@_id'] || '',
    name: (c['display-name'] || []).map((dn) => typeof dn === 'object' ? dn['#text'] : dn),
    url: (c.url || []).map((u) => typeof u === 'object' ? u['#text'] : u)
  }));

  const parseLangText = (items) => {
    if (!items) return [];
    return items.map(item => {
      if (typeof item === 'object') {
        return { lang: item['@_lang'] || '', value: item['#text'] || '' };
      }
      return { lang: '', value: String(item) };
    });
  };

  const programs = (tv.programme || []).map((p) => {
    
    const parseDate = (dateStr) => {
      if (!dateStr) return '';
      const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
      if (match) {
        const [_, y, m, d, h, min, s, tz] = match;
        const tzStr = tz ? `${tz.slice(0,3)}:${tz.slice(3)}` : 'Z';
        return `${y}-${m}-${d}T${h}:${min}:${s}${tzStr}`;
      }
      return dateStr;
    };

    const credits = [];
    if (p.credits) {
      const c = p.credits;
      const roles = ['actor', 'director', 'writer', 'adapter', 'producer', 'composer', 'editor', 'presenter', 'commentator', 'guest'];
      for (const role of roles) {
        if (c[role]) {
          c[role].forEach((name) => {
            credits.push({ role, name: typeof name === 'object' ? name['#text'] : name });
          });
        }
      }
    }

    return {
      id: p['@_id'] || '',
      start: parseDate(p['@_start']),
      stop: parseDate(p['@_stop']),
      channel: p['@_channel'] || '',
      title: parseLangText(p.title),
      desc: parseLangText(p.desc),
      category: parseLangText(p.category),
      date: p.date || '',
      icon: (p.icon || []).map((i) => i['@_src'] || ''),
      rating: (p.rating || []).map((r) => ({
        system: r['@_system'] || '',
        value: typeof r.value === 'object' ? r.value['#text'] : r.value
      })),
      episodeNum: (p['episode-num'] || []).map((e) => ({
        system: e['@_system'] || '',
        value: typeof e === 'object' ? e['#text'] : e
      })),
      subTitle: parseLangText(p['sub-title']),
      credits
    };
  });

  return { channels, programs };
};

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tv generator-info-name="test">
  <channel id="test">
    <display-name>Test</display-name>
  </channel>
  <programme start="20230501120000 +0000" stop="20230501130000 +0000" channel="test">
    <title lang="en">Test Program</title>
    <desc lang="en">This is a test description.</desc>
    <category lang="en">Movie</category>
    <episode-num system="xmltv_ns">1.2.3/</episode-num>
    <rating system="VCHIP">
      <value>TV-MA</value>
    </rating>
    <credits>
      <actor>John Doe</actor>
      <director>Jane Smith</director>
    </credits>
  </programme>
</tv>`;

console.log(JSON.stringify(parseEPG(xml), null, 2));
