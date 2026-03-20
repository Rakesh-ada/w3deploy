import fs from "fs";
import path from "path";
import crypto from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  domain: string;
  repoFullName: string;
  branch: string;
  rootDirectory: string;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
  appPreset: string;
  envVars: { key: string; value: string }[];
  env: string;
  webhookId: number | null;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  domain: string;
  cid: string;
  env: string;
  meta: string;
  commitHash: string;
  deployer: string;
  timestamp: number;
  url: string;
}

interface Database {
  projects: Project[];
  deployments: Deployment[];
}

// ── File paths ───────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "w3deploy-db.json");
const EMPTY_DB: Database = { projects: [], deployments: [] };

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

export function ensureDatabase(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
    return;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.deployments)) {
      throw new Error("Invalid database shape");
    }
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

function loadDb(): Database {
  ensureDatabase();

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      deployments: Array.isArray(parsed.deployments) ? parsed.deployments : [],
    };
  } catch {
    return { projects: [], deployments: [] };
  }
}

function saveDb(db: Database): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// ── Project CRUD ─────────────────────────────────────────────────────────────

export function addProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const db = loadDb();
  const now = Math.floor(Date.now() / 1000);
  const project: Project = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.projects.push(project);
  saveDb(db);
  return project;
}

export function getProjectById(id: string): Project | null {
  const db = loadDb();
  return db.projects.find((p) => p.id === id) ?? null;
}

export function getProjectByDomain(domain: string): Project | null {
  const db = loadDb();
  return db.projects.find((p) => p.domain === domain) ?? null;
}

export function getProjectByRepo(repoFullName: string, userId: string): Project | null {
  const db = loadDb();
  return db.projects.find((p) => p.repoFullName === repoFullName && p.userId === userId) ?? null;
}

export function listProjectsByUser(userId: string): Project[] {
  const db = loadDb();
  return db.projects.filter((p) => p.userId === userId);
}

export function updateProject(id: string, data: Partial<Omit<Project, "id" | "createdAt">>): Project | null {
  const db = loadDb();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  db.projects[idx] = {
    ...db.projects[idx],
    ...data,
    updatedAt: Math.floor(Date.now() / 1000),
  };
  saveDb(db);
  return db.projects[idx];
}

export function upsertProject(
  domain: string,
  userId: string,
  data: Omit<Project, "id" | "createdAt" | "updatedAt" | "domain" | "userId">
): Project {
  const existing = getProjectByDomain(domain);
  if (existing) {
    return updateProject(existing.id, data)!;
  }
  return addProject({ ...data, domain, userId });
}

// ── Deployment CRUD ──────────────────────────────────────────────────────────

export function addDeployment(data: Omit<Deployment, "id">): Deployment {
  const db = loadDb();
  const deployment: Deployment = {
    ...data,
    id: generateId(),
  };
  db.deployments.push(deployment);
  saveDb(db);
  return deployment;
}

export function listDeploymentsByProject(projectId: string): Deployment[] {
  const db = loadDb();
  return db.deployments
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function listDeploymentsByDomain(domain: string): Deployment[] {
  const db = loadDb();
  return db.deployments
    .filter((d) => d.domain === domain)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getLatestDeployment(domain: string): Deployment | null {
  const deployments = listDeploymentsByDomain(domain);
  return deployments[0] ?? null;
}

export function listAllDomainsByUser(userId: string): string[] {
  const projects = listProjectsByUser(userId);
  return projects.map((p) => p.domain);
}

export type RemoveProjectResult = {
  project: Project;
  deployments: Deployment[];
  cids: string[];
};

export function removeProjectByDomainForUser(domain: string, userId: string): RemoveProjectResult | null {
  const db = loadDb();
  const projectIndex = db.projects.findIndex((p) => p.domain === domain && p.userId === userId);
  if (projectIndex === -1) return null;

  const [project] = db.projects.splice(projectIndex, 1);
  const deployments = db.deployments.filter((d) => d.projectId === project.id);
  const deploymentIdSet = new Set(deployments.map((d) => d.id));
  db.deployments = db.deployments.filter((d) => !deploymentIdSet.has(d.id));

  saveDb(db);

  return {
    project,
    deployments,
    cids: Array.from(new Set(deployments.map((d) => d.cid).filter(Boolean))),
  };
}

// ── Active deploy tracking (in-memory) ───────────────────────────────────────

let activeDeployCount = 0;
const MAX_CONCURRENT = 3;

export function canStartDeploy(): boolean {
  return activeDeployCount < MAX_CONCURRENT;
}

export function incrementActiveDeploys(): void {
  activeDeployCount++;
}

export function decrementActiveDeploys(): void {
  if (activeDeployCount > 0) activeDeployCount--;
}

export function getActiveDeployCount(): number {
  return activeDeployCount;
}

export function getMaxConcurrent(): number {
  return MAX_CONCURRENT;
}

// ── Lookup helpers for webhook flow ──────────────────────────────────────────

export function getProjectsByRepo(repoFullName: string): Project[] {
  const db = loadDb();
  return db.projects.filter((p) => p.repoFullName === repoFullName);
}
