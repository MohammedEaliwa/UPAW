const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const kmlPath = path.resolve(__dirname, 'kml_temp', 'doc.kml');

if (!fs.existsSync(kmlPath)) {
  console.error("KML file not found at " + kmlPath);
  process.exit(1);
}

console.log("Reading KML content from " + kmlPath + "...");
const kmlContent = fs.readFileSync(kmlPath, 'utf8');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS map_kml_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    folder TEXT,
    type TEXT,
    coordinates TEXT,
    details TEXT
  )`);

  // Clear existing
  db.run(`DELETE FROM map_kml_features`);

  // Regex to extract Folders
  const folderRegex = /<Folder[^>]*>([\s\S]*?)<\/Folder>/g;
  let folderMatch;
  let count = 0;

  while ((folderMatch = folderRegex.exec(kmlContent)) !== null) {
    const folderBlock = folderMatch[1];
    const nameMatch = /<name>([\s\S]*?)<\/name>/.exec(folderBlock);
    const folderName = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'عام';

    // Extract Placemarks in this Folder
    const placemarkRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/g;
    let placemarkMatch;

    while ((placemarkMatch = placemarkRegex.exec(folderBlock)) !== null) {
      const placemarkBlock = placemarkMatch[1];

      // Name
      const pNameMatch = /<name>([\s\S]*?)<\/name>/.exec(placemarkBlock);
      let placemarkName = pNameMatch ? pNameMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';

      // Description
      const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/.exec(placemarkBlock);
      const details = descMatch ? descMatch[1].trim() : '';

      // Check Geometry
      if (placemarkBlock.includes('<Point>')) {
        const coordMatch = /<Point>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/.exec(placemarkBlock);
        if (coordMatch) {
          const coordStr = coordMatch[1].trim();
          const parts = coordStr.split(',');
          if (parts.length >= 2) {
            const lng = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              const coordinates = JSON.stringify([lat, lng]);
              db.run(
                `INSERT INTO map_kml_features (name, folder, type, coordinates, details) VALUES (?, ?, ?, ?, ?)`,
                [placemarkName, folderName, 'Point', coordinates, details]
              );
              count++;
            }
          }
        }
      } else if (placemarkBlock.includes('<Polygon>')) {
        const coordMatch = /<Polygon>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/.exec(placemarkBlock);
        if (coordMatch) {
          const coordStr = coordMatch[1].trim();
          const tokens = coordStr.split(/\s+/);
          const coordsArr = [];
          tokens.forEach(tok => {
            const parts = tok.split(',');
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                coordsArr.push([lat, lng]);
              }
            }
          });
          if (coordsArr.length > 0) {
            const coordinates = JSON.stringify(coordsArr);
            db.run(
              `INSERT INTO map_kml_features (name, folder, type, coordinates, details) VALUES (?, ?, ?, ?, ?)`,
              [placemarkName, folderName, 'Polygon', coordinates, details]
            );
            count++;
          }
        }
      }
    }
  }

  console.log(`Successfully imported ${count} KML features into the database.`);
});
