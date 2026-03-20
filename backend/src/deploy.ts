import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { type SSEStreamingApi, streamSSE } from "hono/streaming";
import { PinataSDK } from "pinata-web3";
import * as tar from "tar";
import { encryptBuffer } from "./crypto.js";
import {
  upsertProject,
  addDeployment,
  incrementActiveDeploys,
  decrementActiveDeploys,
  canStartDeploy,
  getActiveDeployCount,
  getMaxConcurrent,
  isValidWalletAddress,
} from "./db.js";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || "mock-jwt",
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

const JWT_SECRET = process.env.JWT_SECRET || "w3deploy-super-secret-key-change-me";
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
const BACKEND_URL = process.env.BACKEND_URL || "";
const BASE_DOMAIN = (process.env.BASE_DOMAIN || "web3deploy.me").trim().toLowerCase();
const TEMP_ROOT = path.join(os.tmpdir(), "w3deploy");
const BUILD_OUTPUT_CANDIDATES = ["dist", "out", "build", ".next/static", ".next"] as const;

// ── Types ────────────────────────────────────────────────────────────────────

type DeployRequestBody = {
  repoUrl?: unknown;
  label?: unknown;
  meta?: unknown;
};

type DeployMeta = {
  notes?: string;
  projectName?: string;
  appPreset?: string;
  rootDirectory?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  envVars?: { key: string; value: string }[];
  env?: string;
};

type CommandResult = {
  stdout: string;
  stderr: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: true });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const stderrTail = stderr.trim().slice(-500);
      const summary = `${command} ${args.join(" ")}`.trim();
      const details = stderrTail ? `: ${stderrTail}` : "";
      reject(new Error(`Command failed (${summary}) with exit code ${code}${details}`));
    });
  });
}

function runCommandStreaming(
  command: string,
  args: string[],
  cwd: string,
  onLine: (line: string) => void
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: true });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      const lines = text.split("\n").filter((l: string) => l.trim());
      for (const line of lines) {
        onLine(line.trim());
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      const lines = text.split("\n").filter((l: string) => l.trim());
      for (const line of lines) {
        onLine(line.trim());
      }
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const stderrTail = stderr.trim().slice(-500);
      const summary = `${command} ${args.join(" ")}`.trim();
      const details = stderrTail ? `: ${stderrTail}` : "";
      reject(new Error(`Command failed (${summary}) with exit code ${code}${details}`));
    });
  });
}

async function sendEvent(
  stream: SSEStreamingApi,
  event: "log" | "error" | "done",
  payload: Record<string, unknown>
): Promise<void> {
  await stream.writeSSE({
    event,
    data: JSON.stringify(payload),
  });
}

async function sendLog(stream: SSEStreamingApi, line: string): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed) return;
  await sendEvent(stream, "log", { line: trimmed });
}

async function detectBuildOutputDirectory(projectDir: string, customOutput?: string): Promise<string> {
  // If user specified an output directory, use it
  if (customOutput && customOutput.trim()) {
    const customPath = path.join(projectDir, customOutput.trim());
    try {
      const stats = await fs.stat(customPath);
      if (stats.isDirectory()) return customPath;
    } catch {
      // Fall through to auto-detect
    }
  }

  for (const candidate of BUILD_OUTPUT_CANDIDATES) {
    const candidatePath = path.join(projectDir, candidate);
    try {
      const stats = await fs.stat(candidatePath);
      if (stats.isDirectory()) return candidatePath;
    } catch {
      // Keep scanning
    }
  }

  // For static sites without build folders, fallback to the project directory itself
  return projectDir;
}

async function getCommitHash(repoDir: string): Promise<string> {
  try {
    const { stdout } = await runCommand("git", ["rev-parse", "HEAD"], repoDir);
    const hash = stdout.trim();
    return hash || "unknown";
  } catch {
    return "unknown";
  }
}

function npmExecutable(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function parseMetaSafe(raw: unknown): DeployMeta {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    return JSON.parse(raw) as DeployMeta;
  } catch {
    return { notes: String(raw) };
  }
}

function parseShellCommand(cmd: string): { command: string; args: string[] } {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  // On Windows, handle npm -> npm.cmd
  if (process.platform === "win32" && (command === "npm" || command === "npx" || command === "yarn")) {
    return { command: command + ".cmd", args };
  }
  return { command, args };
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

  try {
    const parsed = new URL(base);
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname.endsWith(".localhost");
    if (isLocalhost) {
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${parsed.protocol}//${projectLabel}.localhost${port}/`;
    }

    if (BASE_DOMAIN) {
      return `${parsed.protocol}//${projectLabel}.${BASE_DOMAIN}/`;
    }
  } catch {
    // Fall through to path-based URL when parsing fails.
  }

  return `${base}/deployments/${projectLabel}/`;
}

function normalizeWalletAddress(value: string): string {
  return value.trim().toUpperCase();
}

function getWalletFromRequest(c: any): string | null {
  const wallet = c.req.header("x-wallet-address") || "";
  if (!wallet) return null;
  if (!isValidWalletAddress(wallet)) return null;
  return normalizeWalletAddress(wallet);
}

// ── Auth middleware ───────────────────────────────────────────────────────────

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

// ── Router ───────────────────────────────────────────────────────────────────

export const deployRouter = new Hono();

// Deploy status endpoint
deployRouter.get("/status", (c) => {
  return c.json({
    active: getActiveDeployCount(),
    max: getMaxConcurrent(),
  });
});

// Main deploy stream
deployRouter.post("/stream", authMiddleware, async (c) => {
  const walletAddress = getWalletFromRequest(c);
  if (!walletAddress) {
    return c.json({ error: "Connect your wallet before deploying." }, 400);
  }

  const userId = walletAddress;

  const body = await c.req.json<DeployRequestBody>().catch(() => null);

  if (!body) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl.trim() : "";
  const labelValue = typeof body.label === "string" ? body.label.trim() : "";
  const label = labelValue || "default-domain";
  const meta = parseMetaSafe(body.meta);

  if (!repoUrl) {
    return c.json({ error: "repoUrl is required" }, 400);
  }

  if (!canStartDeploy()) {
    return c.json({ error: "Max concurrent deploys reached. Please wait." }, 429);
  }

  const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const tempDir = path.join(TEMP_ROOT, deploymentId);

  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  return streamSSE(c, async (stream) => {
    incrementActiveDeploys();

    try {
      await sendLog(stream, "⚡ Starting deployment pipeline...");
      await sendLog(stream, `Project: ${meta.projectName || label}`);
      await sendLog(stream, `Repository: ${repoUrl}`);
      await fs.mkdir(TEMP_ROOT, { recursive: true });

      // ── Step 1: Clone ──────────────────────────────────────────────────
      await sendLog(stream, "📦 Cloning repository...");
      await runCommandStreaming("git", ["clone", "--depth", "1", repoUrl, tempDir], TEMP_ROOT, (line) => {
        sendLog(stream, `  ${line}`).catch(() => {});
      });
      await sendLog(stream, "✓ Repository cloned successfully");

      // Determine working directory (rootDirectory support)
      let workDir = tempDir;
      const rootDir = (meta.rootDirectory || "").trim().replace(/^\.?\/?/, "").replace(/\/+$/, "");
      if (rootDir && rootDir !== ".") {
        workDir = path.join(tempDir, rootDir);
        try {
          await fs.stat(workDir);
          await sendLog(stream, `📂 Using root directory: ${rootDir}`);
        } catch {
          throw new Error(`Root directory "${rootDir}" not found in the repository.`);
        }
      }

      // (Removed package.json verification for static site support)

      // ── Step 2: Write env vars ─────────────────────────────────────────
      const envVars = meta.envVars || [];
      if (envVars.length > 0) {
        await sendLog(stream, `🔐 Writing ${envVars.length} environment variable(s)...`);
        const envContent = envVars
          .filter((v) => v.key && v.key.trim())
          .map((v) => `${v.key.trim()}=${v.value}`)
          .join("\n");
        await fs.writeFile(path.join(workDir, ".env"), envContent + "\n", "utf-8");
        await sendLog(stream, "✓ Environment variables written to .env");
      }

      // (Removed Step 3 and Step 4: No packages/build allowed for static HTML sites)
      await sendLog(stream, "⚡ Static site mode: Skipping npm install and build steps...");

      // ── Step 5: Detect output directory ────────────────────────────────
      const outputDir = await detectBuildOutputDirectory(workDir, meta.outputDirectory);
      await sendLog(stream, `📁 Build output directory: ${path.relative(workDir, outputDir) || path.basename(outputDir)}`);

      // ── Step 6: Create tar archive ─────────────────────────────────────
      await sendLog(stream, "📦 Creating tar archive of build output...");
      const tarballPath = path.join(tempDir, "site.tar.gz");
      await tar.c(
        {
          cwd: outputDir,
          file: tarballPath,
          gzip: true,
        },
        ["."]
      );
      const tarStat = await fs.stat(tarballPath);
      await sendLog(stream, `  Archive size: ${(tarStat.size / 1024).toFixed(1)} KB`);

      // ── Step 7: Encrypt ────────────────────────────────────────────────
      await sendLog(stream, "🔒 Encrypting archive...");
      const tarBuffer = await fs.readFile(tarballPath);
      const encryptedBuffer = encryptBuffer(tarBuffer);
      await sendLog(stream, `  Encrypted size: ${(encryptedBuffer.length / 1024).toFixed(1)} KB`);

      // ── Step 8: Upload to IPFS ─────────────────────────────────────────
      await sendLog(stream, "🌐 Uploading encrypted blob to IPFS via Pinata...");
      const safeLabel = label.replace(/[^a-zA-Z0-9.-]/g, "-");
      const uploadFile = new File(
        [new Uint8Array(encryptedBuffer)],
        `w3deploy-${safeLabel}-${Date.now()}.enc`,
        { type: "application/octet-stream" }
      );
      const uploadResult = await pinata.upload.file(uploadFile);
      const cid = uploadResult.IpfsHash;

      if (!cid) {
        throw new Error("Upload completed without an IPFS CID.");
      }

      const gatewayUrl = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
      const siteUrl = buildDeploymentProxyUrl(label, c.req.url);
      await sendLog(stream, `✓ IPFS upload complete!`);
      await sendLog(stream, `  CID: ${cid}`);
      await sendLog(stream, `  Site URL: ${siteUrl}`);
      await sendLog(stream, `  Raw Gateway Blob: ${gatewayUrl}`);

      // ── Step 9: Get commit hash ────────────────────────────────────────
      const commitHash = await getCommitHash(tempDir);
      await sendLog(stream, `  Commit: ${commitHash.slice(0, 8)}`);

      // ── Step 10: Save to database ──────────────────────────────────────
      await sendLog(stream, "💾 Saving deployment record...");

      // Extract repo full name from URL
      const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
      const repoFullName = repoMatch ? repoMatch[1] : repoUrl;

      const project = await upsertProject(label, userId, {
        repoFullName,
        branch: "main",
        rootDirectory: meta.rootDirectory || "./",
        buildCommand: meta.buildCommand || "npm run build",
        installCommand: meta.installCommand || "npm install",
        outputDirectory: meta.outputDirectory || "",
        appPreset: meta.appPreset || "auto",
        envVars: envVars,
        env: meta.env || "production",
        webhookId: null,
      });

      await addDeployment({
        projectId: project.id,
        domain: label,
        cid,
        env: meta.env || "production",
        meta: meta.notes || "",
        commitHash,
        deployer: userId,
        timestamp: Math.floor(Date.now() / 1000),
        url: siteUrl,
      });

      await sendLog(stream, "✓ Deployment record saved");
      await sendLog(stream, "");
      await sendLog(stream, "🚀 Deployment successful!");

      await sendEvent(stream, "done", {
        domain: label,
        cid,
        url: siteUrl,
        gatewayUrl: siteUrl,
        rawGatewayUrl: gatewayUrl,
        projectId: project.id,
      });
    } catch (error: unknown) {
      console.error("Deployment workflow failed:", error);
      await sendEvent(stream, "error", { message: getErrorMessage(error) });
    } finally {
      decrementActiveDeploys();
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Failed to remove deployment temp directory:", cleanupError);
      }
    }
  });
});

// ── Export a standalone deploy function for webhook usage ─────────────────────

export async function triggerDeploy(
  repoUrl: string,
  label: string,
  userId: string,
  projectMeta: DeployMeta,
  onLog?: (line: string) => void
): Promise<{ cid: string; url: string; commitHash: string } | null> {
  if (!canStartDeploy()) {
    onLog?.("Max concurrent deploys reached. Skipping.");
    return null;
  }

  incrementActiveDeploys();

  const deploymentId = `webhook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const tempDir = path.join(TEMP_ROOT, deploymentId);
  const log = onLog || console.log;

  try {
    await fs.mkdir(TEMP_ROOT, { recursive: true });

    log("Cloning repository...");
    await runCommand("git", ["clone", "--depth", "1", repoUrl, tempDir], TEMP_ROOT);

    let workDir = tempDir;
    const rootDir = (projectMeta.rootDirectory || "").trim().replace(/^\.?\/?/, "").replace(/\/+$/, "");
    if (rootDir && rootDir !== ".") {
      workDir = path.join(tempDir, rootDir);
    }

    // Write env vars
    const envVars = projectMeta.envVars || [];
    if (envVars.length > 0) {
      const envContent = envVars
        .filter((v) => v.key && v.key.trim())
        .map((v) => `${v.key.trim()}=${v.value}`)
        .join("\n");
      await fs.writeFile(path.join(workDir, ".env"), envContent + "\n", "utf-8");
    }

    // (Removed install and build steps for static HTML sites)
    log("Static site mode: Skipping npm install and build steps...");

    // Detect output
    const outputDir = await detectBuildOutputDirectory(workDir, projectMeta.outputDirectory);
    log(`Output directory: ${path.basename(outputDir)}`);

    // Tar + encrypt + upload
    const tarballPath = path.join(tempDir, "site.tar.gz");
    await tar.c({ cwd: outputDir, file: tarballPath, gzip: true }, ["."]);
    const tarBuffer = await fs.readFile(tarballPath);
    const encryptedBuffer = encryptBuffer(tarBuffer);

    const safeLabel = label.replace(/[^a-zA-Z0-9.-]/g, "-");
    const uploadFile = new File(
      [new Uint8Array(encryptedBuffer)],
      `w3deploy-${safeLabel}-${Date.now()}.enc`,
      { type: "application/octet-stream" }
    );
    const uploadResult = await pinata.upload.file(uploadFile);
    const cid = uploadResult.IpfsHash;
    const deploymentUrl = buildDeploymentProxyUrl(label);
    const commitHash = await getCommitHash(tempDir);

    log(`Deployed to IPFS: ${cid}`);

    // Save deployment record
    const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
    const repoFullName = repoMatch ? repoMatch[1] : repoUrl;

    const project = await upsertProject(label, userId, {
      repoFullName,
      branch: "main",
      rootDirectory: projectMeta.rootDirectory || "./",
      buildCommand: projectMeta.buildCommand || "npm run build",
      installCommand: projectMeta.installCommand || "npm install",
      outputDirectory: projectMeta.outputDirectory || "",
      appPreset: projectMeta.appPreset || "auto",
      envVars,
      env: projectMeta.env || "production",
      webhookId: null,
    });

    await addDeployment({
      projectId: project.id,
      domain: label,
      cid,
      env: projectMeta.env || "production",
      meta: "Auto-deploy from GitHub push",
      commitHash,
      deployer: userId,
      timestamp: Math.floor(Date.now() / 1000),
      url: deploymentUrl,
    });

    return { cid, url: deploymentUrl, commitHash };
  } catch (error) {
    log(`Deployment failed: ${getErrorMessage(error)}`);
    return null;
  } finally {
    decrementActiveDeploys();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
