import express from "express";

import authenticateToken from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { registerSchema } from "@printworks/validation";
import * as c from "../controller/auth.js";

const router = express.Router();

router.get("/me", authenticateToken, c.getUser);
router.post("/register", validate(registerSchema), c.registerUser);
router.post("/login", validate(registerSchema), c.logUserIn);
router.post("/logout", c.logUserOut);

export default router;
