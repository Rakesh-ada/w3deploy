import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import algosdk from "algosdk";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PinataSDK } from "pinata-web3";
import { verifyMessage } from "ethers";
import * as tar from "tar";
import { encryptBuffer } from "./crypto.js";
import {
  addDeployment,
  canStartDeploy,
  decrementActiveDeploys,
  getActiveDeployCount,
  getMaxConcurrent,
  incrementActiveDeploys,
  isValidWalletAddress,
  upsertProject,
} from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "w3deploy-super-secret-key-change-me";
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
const BACKEND_URL = process.env.BACKEND_URL || "";
const TEMP_ROOT = path.join(os.tmpdir(), "w3deploy", "mcp");
const MAX_FILES = 1000;
const MAX_PATH_LENGTH = 200;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type ChallengeRecord = {
  id: string;
  walletAddress: string;
  message: string;
  expiresAt: number;
};

const challengeStore = new Map<string, ChallengeRecord>();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || "",
  pinataGateway: PINATA_GATEWAY,
});

type AgentFile = {
  path?: unknown;
  content?: unknown;
};

type DeployCodeBody = {
  label?: unknown;
  files?: unknown;
  meta?: unknown;
  challengeId?: unknown;
  challengeSignature?: unknown;
};

export const mcpRouter = new Hono();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

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

function resolveProxyBaseUrl(requestUrl?: string): string {
  const configured = BACKEND_URL.trim();
  if (configured) {
    return stripTrailingSlashes(configured);
  }

  if (requestUrl) {
    try {
      const parsed = new URL(requestUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      // Ignore malformed request URLs and fall back to relative paths.
    }
  }

  return "";
}

function buildDeploymentProxyUrl(projectName: string, requestUrl?: string): string {
  const projectLabel = normalizeProjectLabel(projectName);
  const base = resolveProxyBaseUrl(requestUrl);
  if (!base) return `/deployments/${projectLabel}/`;
  return `${base}/deployments/${projectLabel}/`;
}

function normalizeWalletAddress(value: string): string {
  const trimmed = value.trim();
  if (EVM_ADDRESS_REGEX.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed.toUpperCase();
}

function getWalletFromRequest(c: any): string | null {
  const wallet = c.req.header("x-wallet-address") || "";
  if (!wallet) return null;
  if (!isValidWalletAddress(wallet)) return null;
  return normalizeWalletAddress(wallet);
}

function isAlgorandWalletAddress(value: string): boolean {
  return algosdk.isValidAddress(value.trim().toUpperCase());
}

function isEvmWalletAddress(value: string): boolean {
  return EVM_ADDRESS_REGEX.test(value.trim());
}

function pruneExpiredChallenges(): void {
  const now = Date.now();
  for (const [id, record] of challengeStore.entries()) {
    if (record.expiresAt <= now) {
      challengeStore.delete(id);
    }
  }
}

function buildChallengeMessage(walletAddress: string, challengeId: string, expiresAt: number): string {
  return [
    "W3DEPLOY MCP Deploy Challenge",
    `Challenge ID: ${challengeId}`,
    `Wallet: ${walletAddress}`,
    `Expires At: ${new Date(expiresAt).toISOString()}`,
    "Action: authorize deploy-code",
  ].join("\n");
}

function parseSignatureBytes(signature: string): Uint8Array | null {
  const raw = signature.trim();
  if (!raw) return null;

  if (raw.startsWith("0x") && raw.length > 2 && raw.length % 2 === 0) {
    try {
      return Uint8Array.from(Buffer.from(raw.slice(2), "hex"));
    } catch {
      return null;
    }
  }

  try {
    return Uint8Array.from(Buffer.from(raw, "base64"));
  } catch {
    return null;
  }
}

function verifyWalletSignature(walletAddress: string, message: string, signature: string): boolean {
  if (isEvmWalletAddress(walletAddress)) {
    try {
      const recovered = verifyMessage(message, signature);
      return recovered.toLowerCase() === walletAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  if (isAlgorandWalletAddress(walletAddress)) {
    const signatureBytes = parseSignatureBytes(signature);
    if (!signatureBytes) {
      return false;
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      return algosdk.verifyBytes(messageBytes, signatureBytes, walletAddress);
    } catch {
      return false;
    }
  }

  return false;
}

function validateChallengeOwnership(
  walletAddress: string,
  challengeIdRaw: unknown,
  challengeSignatureRaw: unknown
): { ok: boolean; message?: string } {
  if (typeof challengeIdRaw !== "string" || !challengeIdRaw.trim()) {
    return { ok: false, message: "challengeId is required." };
  }
  if (typeof challengeSignatureRaw !== "string" || !challengeSignatureRaw.trim()) {
    return { ok: false, message: "challengeSignature is required." };
  }

  pruneExpiredChallenges();

  const challengeId = challengeIdRaw.trim();
  const challenge = challengeStore.get(challengeId);
  if (!challenge) {
    return { ok: false, message: "Challenge not found or expired." };
  }

  if (challenge.walletAddress !== walletAddress) {
    challengeStore.delete(challengeId);
    return { ok: false, message: "Challenge wallet mismatch." };
  }

  if (challenge.expiresAt <= Date.now()) {
    challengeStore.delete(challengeId);
    return { ok: false, message: "Challenge expired." };
  }

  const verified = verifyWalletSignature(walletAddress, challenge.message, challengeSignatureRaw.trim());
  if (!verified) {
    return { ok: false, message: "Invalid challenge signature." };
  }

  challengeStore.delete(challengeId);
  return { ok: true };
}

function parseMetaSafe(raw: unknown): { notes?: string; env?: string } {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as { notes?: string; env?: string };
    } catch {
      return { notes: raw };
    }
  }

  if (raw && typeof raw === "object") {
    const obj = raw as { notes?: unknown; env?: unknown };
    return {
      notes: typeof obj.notes === "string" ? obj.notes : undefined,
      env: typeof obj.env === "string" ? obj.env : undefined,
    };
  }

  return {};
}

function validateAndNormalizeFiles(input: unknown): Array<{ path: string; content: string }> {
  if (!Array.isArray(input)) {
    throw new Error("files must be an array");
  }

  if (input.length === 0) {
    throw new Error("files cannot be empty");
  }

  if (input.length > MAX_FILES) {
    throw new Error(`Too many files. Maximum allowed is ${MAX_FILES}.`);
  }

  const normalized: Array<{ path: string; content: string }> = [];
  const seen = new Set<string>();

  for (const raw of input) {
    const item = raw as AgentFile;
    if (typeof item.path !== "string" || typeof item.content !== "string") {
      throw new Error("Each file must have string path and content fields.");
    }

    const filePath = item.path.replace(/\\/g, "/").trim().replace(/^\/+/, "");
    if (!filePath || filePath.length > MAX_PATH_LENGTH) {
      throw new Error(`Invalid file path: ${item.path}`);
    }

    if (filePath.includes("..") || path.posix.isAbsolute(filePath)) {
      throw new Error(`File path is not allowed: ${item.path}`);
    }

    if (Buffer.byteLength(item.content, "utf-8") > MAX_FILE_BYTES) {
      throw new Error(`File is too large: ${item.path}`);
    }

    if (seen.has(filePath)) {
      throw new Error(`Duplicate file path detected: ${filePath}`);
    }

    seen.add(filePath);
    normalized.push({ path: filePath, content: item.content });
  }

  return normalized;
}

async function writeAgentFiles(rootDir: string, files: Array<{ path: string; content: string }>): Promise<void> {
  for (const file of files) {
    const outputPath = path.join(rootDir, file.path);
    const resolved = path.resolve(outputPath);
    if (!resolved.startsWith(path.resolve(rootDir))) {
      throw new Error(`Unsafe output path: ${file.path}`);
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, file.content, "utf-8");
  }
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

// MCP Setup / Auth Endpoint
mcpRouter.post("/connect", async (c) => {
  const { ide, workspace } = await c.req.json().catch(() => ({ ide: "unknown", workspace: "unknown" }));
  return c.json({
    status: "ok",
    mcp_token: "mock-mcp-token-" + Date.now(),
    message: "MCP Connection established. AI Agents can now push to W3DEPLOY.",
    ide,
    workspace,
  });
});

// Create a one-time challenge message that must be signed by the user's wallet.
mcpRouter.post("/challenge", authMiddleware, async (c) => {
  const walletAddress = getWalletFromRequest(c);
  if (!walletAddress) {
    return c.json({ error: "Connect your wallet before requesting a challenge." }, 400);
  }

  if (!isEvmWalletAddress(walletAddress) && !isAlgorandWalletAddress(walletAddress)) {
    return c.json({ error: "Unsupported wallet format." }, 400);
  }

  pruneExpiredChallenges();

  const challengeId = crypto.randomUUID();
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const message = buildChallengeMessage(walletAddress, challengeId, expiresAt);

  challengeStore.set(challengeId, {
    id: challengeId,
    walletAddress,
    message,
    expiresAt,
  });

  return c.json({
    challengeId,
    walletAddress,
    message,
    expiresAt,
    challengeType: isEvmWalletAddress(walletAddress) ? "evm_personal_sign" : "algorand_sign_bytes",
  });
});

// Deploy code sent directly from an agent/IDE via MCP
mcpRouter.post("/deploy-code", authMiddleware, async (c) => {
  const walletAddress = getWalletFromRequest(c);
  if (!walletAddress) {
    return c.json({ error: "Connect your wallet before deploying." }, 400);
  }

  if (!canStartDeploy()) {
    return c.json({ error: "Max concurrent deploys reached. Please wait." }, 429);
  }

  const body = await c.req.json<DeployCodeBody>().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const ownership = validateChallengeOwnership(walletAddress, body.challengeId, body.challengeSignature);
  if (!ownership.ok) {
    return c.json({ error: ownership.message || "Wallet ownership verification failed." }, 401);
  }

  const labelInput = typeof body.label === "string" ? body.label : "";
  const label = normalizeProjectLabel(labelInput || "agent-site");

  let files: Array<{ path: string; content: string }>;
  try {
    files = validateAndNormalizeFiles(body.files);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 400);
  }

  const meta = parseMetaSafe(body.meta);
  const deploymentId = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const tempDir = path.join(TEMP_ROOT, deploymentId);

  incrementActiveDeploys();

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await writeAgentFiles(tempDir, files);

    const tarballPath = path.join(tempDir, "site.tar.gz");
    await tar.c(
      {
        cwd: tempDir,
        file: tarballPath,
        gzip: true,
      },
      ["."]
    );

    const tarBuffer = await fs.readFile(tarballPath);
    const encryptedBuffer = encryptBuffer(tarBuffer);

    const uploadFile = new File(
      [new Uint8Array(encryptedBuffer)],
      `w3deploy-${label}-${Date.now()}.enc`,
      { type: "application/octet-stream" }
    );

    const uploadResult = await pinata.upload.file(uploadFile);
    const cid = uploadResult.IpfsHash;
    if (!cid) {
      throw new Error("Upload completed without an IPFS CID.");
    }

    const siteUrl = buildDeploymentProxyUrl(label, c.req.url);
    const gatewayUrl = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    const project = await upsertProject(label, walletAddress, {
      repoFullName: "agent://mcp",
      branch: "main",
      rootDirectory: "./",
      buildCommand: "none",
      installCommand: "none",
      outputDirectory: "./",
      appPreset: "mcp-agent",
      envVars: [],
      env: meta.env || "production",
      webhookId: null,
    });

    await addDeployment({
      projectId: project.id,
      domain: label,
      cid,
      env: meta.env || "production",
      meta: meta.notes || `Agent MCP deploy (${files.length} file(s))`,
      commitHash: "agent-direct",
      deployer: walletAddress,
      timestamp: Math.floor(Date.now() / 1000),
      url: siteUrl,
    });

    return c.json({
      ok: true,
      domain: label,
      cid,
      url: siteUrl,
      gatewayUrl: siteUrl,
      rawGatewayUrl: gatewayUrl,
      files: files.length,
      activeDeploys: getActiveDeployCount(),
      maxDeploys: getMaxConcurrent(),
    });
  } catch (error) {
    console.error("MCP direct deploy failed:", error);
    return c.json({ error: getErrorMessage(error) }, 500);
  } finally {
    decrementActiveDeploys();
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

// Minimal status endpoint for MCP clients
mcpRouter.get("/status", (c) => {
  return c.json({
    active: getActiveDeployCount(),
    max: getMaxConcurrent(),
    ready: true,
  });
});

export default mcpRouter;
