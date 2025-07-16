import express from "express";
import cors from "cors";
import helmet from "helmet";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cookieParser = require("cookie-parser");

import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";
import filesRoutes from "./routes/files.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/files", filesRoutes);

export default app;

// TODO:  add gc
//          corrupted files due to formidable error handling
//          etc
// TODO:  add rate limiting
// TODO:  add logging
// TODO:  scan uploaded files with ClamAV
// TODO:  customize error handler
