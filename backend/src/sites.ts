import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PinataSDK } from "pinata-web3";
import {
  listProjectsByUser,
  getProjectByDomain,
  listDeploymentsByDomain,
  getLatestDeployment,
  getActiveDeployCount,
  getMaxConcurrent,
  removeProjectByDomainForUser,
} from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "w3deploy-super-secret-key-change-me";
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
const PINATA_JWT = process.env.PINATA_JWT || "";
const BACKEND_URL = process.env.BACKEND_URL || "";

export const sitesRouter = new Hono();

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeProjectLabel(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "project";
}

function getBackendBaseUrl(c: any): string {
  const configured = BACKEND_URL.trim();
  if (configured) {
    return stripTrailingSlashes(configured);
  }

  try {
    const requestUrl = new URL(c.req.url);
    return `${requestUrl.protocol}//${requestUrl.host}`;
  } catch {
    return "";
  }
}

function deploymentProxyUrl(c: any, projectName: string): string {
  const label = normalizeProjectLabel(projectName);
  const base = getBackendBaseUrl(c);
  if (!base) return `/deployments/${label}/`;

  try {
    const parsed = new URL(base);
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname.endsWith(".localhost");
    if (isLocalhost) {
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${parsed.protocol}//${label}.localhost${port}/`;
    }
  } catch {
    // Fall through to path-based URL when parsing fails.
  }

  return `${base}/deployments/${label}/`;
}

function pinataGatewayUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verify(token, JWT_SECRET, "HS256");
    c.set("jwtPayload", decoded);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};

// GET /api/sites - list all domains for the authenticated user
sitesRouter.get("/", authMiddleware, async (c) => {
  const user = c.get("jwtPayload") as any;
  const projects = listProjectsByUser(user.sub);
  const domains = projects.map((p) => p.domain);
  return c.json({ domains });
});

// GET /api/sites/:domain - project detail + deployment history
sitesRouter.get("/:domain", authMiddleware, async (c) => {
  const user = c.get("jwtPayload") as any;
  const domain = decodeURIComponent(c.req.param("domain"));
  const project = getProjectByDomain(domain);

  if (!project || project.userId !== user.sub) {
    return c.json({ domain, count: 0, latest: null, history: [] });
  }

  const deployments = listDeploymentsByDomain(domain);
  const latest = deployments[0] ?? null;

  return c.json({
    domain,
    count: deployments.length,
    latest: latest
      ? {
          cid: latest.cid,
          deployer: latest.deployer,
          env: latest.env,
          meta: latest.meta,
          timestamp: latest.timestamp,
          url: deploymentProxyUrl(c, domain),
        }
      : null,
    history: deployments.map((d) => ({
      cid: d.cid,
      deployer: d.deployer,
      env: d.env,
      meta: d.meta,
      timestamp: d.timestamp,
      url: deploymentProxyUrl(c, domain),
    })),
  });
});

// DELETE /api/sites/:domain - delete project/deployments from JSON and unpin from Pinata
sitesRouter.delete("/:domain", authMiddleware, async (c) => {
  const user = c.get("jwtPayload") as any;
  const domain = decodeURIComponent(c.req.param("domain"));
  const removed = removeProjectByDomainForUser(domain, user.sub);

  if (!removed) {
    return c.json({ error: "Project not found" }, 404);
  }

  const unpinErrors: string[] = [];

  if (removed.cids.length > 0) {
    if (!PINATA_JWT) {
      unpinErrors.push(...removed.cids);
    } else {
      try {
        const unpinned = await pinata.unpin(removed.cids);
        const failed = unpinned.filter((item) => item.status !== "success").map((item) => item.hash);
        unpinErrors.push(...failed);
      } catch {
        unpinErrors.push(...removed.cids);
      }
    }
  }

  return c.json({
    ok: true,
    domain,
    deletedDeployments: removed.deployments.length,
    unpinned: removed.cids.length - unpinErrors.length,
    unpinErrors,
  });
});

// GET /api/sites/:domain/ipns - IPNS-like metadata
sitesRouter.get("/:domain/ipns", authMiddleware, async (c) => {
  const user = c.get("jwtPayload") as any;
  const domain = decodeURIComponent(c.req.param("domain"));
  const project = getProjectByDomain(domain);
  const latest = getLatestDeployment(domain);

  if (!project || project.userId !== user.sub || !latest) {
    return c.json({ error: "No deployments found for this domain" }, 404);
  }

  const siteUrl = deploymentProxyUrl(c, domain);
  const gatewayUrl = pinataGatewayUrl(latest.cid);

  return c.json({
    domain,
    ipnsKey: `k51-${project.id.slice(0, 20)}`,
    latestCid: latest.cid,
    latestSeq: listDeploymentsByDomain(domain).length,
    registeredAt: project.createdAt,
    updatedAt: latest.timestamp,
    active: true,
    gateways: [siteUrl, gatewayUrl],
    url: siteUrl,
  });
});

// GET /api/deploy/status - active deploy count
export function deployStatusHandler(c: any) {
  return c.json({
    active: getActiveDeployCount(),
    max: getMaxConcurrent(),
  });
}
