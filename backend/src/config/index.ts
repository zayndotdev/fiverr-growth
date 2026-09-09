import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend, parent, or root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || ""
};
