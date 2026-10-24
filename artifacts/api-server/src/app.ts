import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import munimRouter from "./routes/munim";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Munim handlers read raw request bodies themselves, so mount them before the body parsers.
app.use("/api", munimRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Production: serve the built frontend from the same origin (single Render service).
const publicDir = path.resolve(process.cwd(), "../munim/dist/public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

export default app;
