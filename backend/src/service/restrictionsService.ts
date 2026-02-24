import pool from "../config/db.js";

export async function findRestrictions(
    lat: number,
    long: number,
    rad: number
) {
    const query = `
        SELECT *
        FROM restriction
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_Point($2, $1), 4326)::geography,
            $3
        );
    `;
    const values = [lat, long, rad];
    const results = await pool.query(query, values);
    return results.rows;
}