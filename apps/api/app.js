import express from "express";
import cors from "cors";
import helmet from "helmet";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cookieParser = require("cookie-parser");

import authRoutes from "./routes/auth.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);

export default app;
