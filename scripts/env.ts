// Scripts read the same settings as the app: .env.local first, then .env.
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });
