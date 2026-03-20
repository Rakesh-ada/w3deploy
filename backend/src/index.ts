import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import "dotenv/config";
import { authRouter } from "./auth.js";
import { mcpRouter } from "./mcp.js";
import { githubRouter, startPolling } from "./github.js";
import { proxyRouter, serveDeploymentByIdentifier } from "./proxy.js";
import { deployRouter } from "./deploy.js";
import { sitesRouter } from "./sites.js";
import { ensureDatabase } from "./db.js";

const app = new Hono();
const BASE_DOMAIN = (process.env.BASE_DOMAIN || "web3deploy.me").trim().toLowerCase();

app.use("/*", cors());

function projectFromHost(hostHeader?: string): string | null {
  if (!hostHeader) return null;
  const hostname = hostHeader.split(":")[0].toLowerCase();
  if (!hostname) return null;

  // Local dev support: <project>.localhost
  if (hostname.endsWith(".localhost") && hostname !== "localhost") {
    const rawPrefix = hostname.slice(0, -".localhost".length);
    const project = rawPrefix.split(".")[0];
    return project || null;
  }

  // Production support: <project>.<base-domain> (preferred)
  // Backward compatibility: www.<project>.<base-domain>
  const suffix = `.${BASE_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;

  const withoutSuffix = hostname.slice(0, -suffix.length);
  if (!withoutSuffix) return null;

  if (withoutSuffix.startsWith("www.")) {
    const project = withoutSuffix.slice("www.".length);
    return project || null;
  }

  return withoutSuffix;
}

app.onError((err, c) => {
  console.error("Global App Error:", err);
  return c.text("Internal Server Error", 500);
});

// Vercel-like local URLs: http://<project>.localhost:8080/
app.use("/*", async (c, next) => {
  const path = c.req.path;
  if (path.startsWith("/api") || path.startsWith("/deployments")) {
    return next();
  }

  const project = projectFromHost(c.req.header("host"));
  if (!project) {
    return next();
  }

  return serveDeploymentByIdentifier(c, project, path);
});

app.get("/", (c) => {
  return c.json({ message: "W3DEPLOY Backend API works!" });
});

app.route("/api/auth", authRouter);
app.route("/api/mcp", mcpRouter);
app.route("/api/github", githubRouter);
app.route("/api/deploy", deployRouter);
app.route("/api/sites", sitesRouter);

// The blazing fast IPFS cache proxy
app.route("/deployments", proxyRouter);

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

void ensureDatabase();

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Start GitHub polling for auto-deploy (fallback when no webhook URL is configured)
startPolling(60_000);
