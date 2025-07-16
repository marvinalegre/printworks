import express from "express";

import authenticateToken from "../middleware/auth.js";
import * as c from "../controller/order.js";

const router = express.Router();

router.get("/", authenticateToken, c.getOrder);

export default router;
