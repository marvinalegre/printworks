import express from "express";

import authenticateToken from "../middleware/auth.js";
import * as c from "../controller/files.js";

const router = express.Router();

router.post("/upload", authenticateToken, c.handleUpload);
router.delete("/remove", authenticateToken, c.removeFile);

export default router;
