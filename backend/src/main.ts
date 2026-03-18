import "dotenv/config";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import logger from "morgan";
import os from "os";
import userRouter from "./User/router";
import uploadRouter from "../upload/router";
import taskRouter from "./Task/router";

const app: Express = express();
const port = Number(process.env.PORT || 8888);

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const ipAddresses: string[] = [];

  Object.values(interfaces).forEach((iface) => {
    if (iface) {
      iface.forEach((details) => {
        if (details.family === "IPv4" && !details.internal) {
          ipAddresses.push(details.address);
        }
      });
    }
  });

  return ipAddresses;
}

const corsOptions: cors.CorsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
// Ensure CORS headers are present even on errors and non-simple requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(logger("dev"));
app.options("*", cors(corsOptions));

app.use("/api/user", userRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/tasks", taskRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Backend running", });
});

// Global error handler to return JSON and keep CORS headers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", detail: err?.message || err || "unknown" });
});

app.listen(port, "0.0.0.0", () => {
  const ipAddresses = getLocalIpAddresses();
  console.log(`Server running on port ${port}`);
  console.log("Server can be accessed at:");
  console.log(`- Local: http://localhost:${port}`);
  ipAddresses.forEach((ip) => {
    console.log(`- Network: http://${ip}:${port}`);
  });
});
