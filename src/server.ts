import dotenv from "dotenv";
dotenv.config({
    path: "./src/.env"
  });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./router/router";
import { initDb } from "./db/init";



const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));  
app.use(express.json());
app.use(cookieParser());
console.log("Router loaded");
app.use(router);

initDb()
  .then(() => {
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
