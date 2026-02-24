import * as restrictionsService from "../service/restrictionsService.js";

export async function getRestrictions(req, res) {
    try {
        const { lat, long, rad } = req.query;
        if(!lat || !long || !rad)
        {
            return res.status(400).json({ error: "Missing parameters" });
        }
        const restrictions = await restrictionsService.findRestrictions(
            Number(lat),
            Number(long),
            Number(rad)
        );
        res.json(restrictions);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}