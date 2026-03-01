import pool from "../config/db.js";

async function aggregateFaaFacilitiesCells() {

    const client = await pool.connect();

    try {

        await client.query('SET statement_timeout = 0');

        const airportSets = await client.query(`
            SELECT DISTINCT
                array_agg(airport_id ORDER BY airport_id) AS airport_ids
            FROM gridcellairport
            GROUP BY grid_id
        `);

        console.log(`Processing ${airportSets.rowCount} unique airport combinations...`);

        let processed = 0;
        let failed = 0;

        // batches by airport combinations
        for (const row of airportSets.rows) {

            try {

                await client.query('BEGIN');

                await client.query(`
                    WITH cell_airports AS (
                        SELECT
                            g.grid_id,
                            g.shape,
                            g.max_height,
                            g.unit,
                            array_agg(ca.airport_id ORDER BY ca.airport_id) AS airport_ids
                        FROM faafacilitygridcell g
                        JOIN gridcellairport ca ON ca.grid_id = g.grid_id
                        GROUP BY g.grid_id, g.shape, g.max_height, g.unit
                        HAVING array_agg(ca.airport_id ORDER BY ca.airport_id) = $1
                    ),
                    unioned AS (
                        SELECT
                            airport_ids,
                            max_height,
                            unit,
                            ST_Union(shape) AS geom
                        FROM cell_airports
                        GROUP BY airport_ids, max_height, unit
                    ),
                    dumped AS (
                        SELECT
                            airport_ids,
                            max_height,
                            unit,
                            (ST_Dump(geom)).geom AS geom
                        FROM unioned
                    ),
                    inserted AS (
                        INSERT INTO faafacilityaggregate (max_height, unit, geom)
                        SELECT max_height, unit, geom
                        FROM dumped
                        ON CONFLICT DO NOTHING
                        RETURNING agg_restriction_id, max_height, unit, geom
                    )
                    INSERT INTO aggregatedgridcellairport (agg_restriction_id, airport_id)
                    SELECT DISTINCT i.agg_restriction_id, ca.airport_id
                    FROM inserted i
                    JOIN faafacilitygridcell g
                        ON ST_Contains(i.geom, g.shape)
                        AND i.max_height = g.max_height
                        AND i.unit = g.unit
                    JOIN gridcellairport ca ON ca.grid_id = g.grid_id
                    ON CONFLICT DO NOTHING
                `, [row.airport_ids]);

                await client.query('COMMIT');

                processed++;
                console.log(`[${processed}/${airportSets.rowCount}] Processed combination ${row.airport_ids}`);

            } catch (error) {

                await client.query('ROLLBACK');
                failed++;
                console.error(`Failed to process combination ${row.airport_ids}:`, error);
            }
        }

        console.log(`Done. ${processed} succeeded, ${failed} failed.`);

    } catch (error) {

        console.error('Fatal error:', error);
        throw error;

    } finally {
        client.release();
    }
}

export default aggregateFaaFacilitiesCells;