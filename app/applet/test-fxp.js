const { XMLParser } = require('fast-xml-parser');

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
  </programme>
</tv>`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});
const result = parser.parse(xml);
console.log(JSON.stringify(result, null, 2));
