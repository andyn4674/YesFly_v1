import { Router } from "express";
import restrictionsRoute from "./restrictionsRoute.js";

const routes = Router();

routes.use("/api/restirctions", restrictionsRoute);

export default routes;