const parser = require('epg-parser');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tv generator-info-name="test">
  <channel id="test">
    <display-name>Test</display-name>
  </channel>
  <programme start="20230501120000 +0000" stop="20230501130000 +0000" channel="test">
    <title lang="en">Test Program</title>
  </programme>
</tv>`;
console.log(JSON.stringify(parser.default ? parser.default(xml) : parser(xml), null, 2));
