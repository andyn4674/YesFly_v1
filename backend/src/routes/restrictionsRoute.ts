import { Router } from "express";
import * as restrictionsController from "../controller/restrictionsController.js"

const restrictionsRoute = Router();

restrictionsRoute.get("/api/restrictions", restrictionsController.getRestrictions);

export default restrictionsRoute;