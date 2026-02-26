import fetch from "node-fetch";
import pool from "../config/db.js";

const API_URL =
  "https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/FAA_UAS_FacilityMap_Data/FeatureServer/0/query";

const LIMIT = 2000;

interface FAAFeatureCollection {
  features: any[];
}

async function fetchFaaFacilitiesGrids(offset: number, max: number) {
  console.log("started");

  while (offset < max) {

    console.log("lap");

    const url = new URL(API_URL);

    url.searchParams.set("where", "1=1");
    url.searchParams.set("outFields", "*");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("f", "geojson");
    url.searchParams.set("resultOffset", offset.toString());
    url.searchParams.set("resultRecordCount", LIMIT.toString());

    const response = await fetch(url.toString());
    const data = (await response.json()) as FAAFeatureCollection;

    if (!data.features || data.features.length === 0) {
        console.log("!data.features || data.features.length === 0");
      break;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let i = 0;
      for (const feature of data.features) {
        console.log("new feature " + (i++));
        const props = feature.properties;

        const gridId = props.OBJECTID;
        const ceiling = props.CEILING;
        const unit = props.UNIT;
        const geometry = JSON.stringify(feature.geometry);

        await client.query(
          `
          INSERT INTO faafacilitygridcell (
            grid_id,
            shape,
            max_height,
            unit,
            updated_at
          )
          VALUES (
            $1,
            ST_SetSRID(ST_GeomFromGeoJSON($2), 4326),
            $3,
            $4,
            NOW()
          )
          ON CONFLICT (grid_id)
          DO UPDATE SET
            shape = EXCLUDED.shape,
            max_height = EXCLUDED.max_height,
            unit = EXCLUDED.unit,
            updated_at = NOW();
          `,
          [gridId, geometry, ceiling, unit]
        );

        await client.query(
          `DELETE FROM gridcellairport WHERE grid_id = $1`,
          [gridId]
        );

        for (let i = 1; i <= 5; i++) {
          const faaId = props[`APT${i}_FAAID`];
          if (!faaId) continue;

          const icao = props[`APT${i}_ICAO`];
          const name = props[`APT${i}_NAME`];
          const laancEnabled = props[`APT${i}_LAANC`] === 1;

          // Upsert airport and return id
          const airportResult = await client.query(
            `
            INSERT INTO airport (faa_id, icao, name, laanc_enabled)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (faa_id)
            DO UPDATE SET
              icao = EXCLUDED.icao,
              name = EXCLUDED.name,
              laanc_enabled = EXCLUDED.laanc_enabled
            RETURNING airport_id;
            `,
            [faaId, icao, name, laancEnabled]
          );

          const airportId = airportResult.rows[0].airport_id;

          // Insert junction row
          await client.query(
            `
            INSERT INTO gridcellairport (grid_id, airport_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
            `,
            [gridId, airportId]
          );
        }
      }
console.log("COMMITTING BATCH");
      await client.query("COMMIT");
      console.log(`Processed ${data.features.length} records (offset ${offset})`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error processing batch:", err);
      throw err;
    } finally {
      client.release();
    }

    offset += LIMIT;
  }
  console.log("done");
}

export default fetchFaaFacilitiesGrids;