import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import type { ArchitectureRegistration } from "@arch-mcp/core";

const registrySchema = z.object({
  architectures: z.array(z.object({
    id: z.string().min(1),
    path: z.string().min(1),
    registeredAt: z.string(),
  })),
});

export function registryPath(): string {
  return process.env.ARCH_MCP_CONFIG ?? join(homedir(), ".config", "arch-mcp", "registry.json");
}

export async function readRegistry(): Promise<ArchitectureRegistration[]> {
  try {
    const raw = await readFile(registryPath(), "utf8");
    return registrySchema.parse(JSON.parse(raw)).architectures;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error(`Could not read architecture registry: ${(error as Error).message}`);
  }
}

export async function writeRegistry(architectures: ArchitectureRegistration[]): Promise<void> {
  const path = registryPath();
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ architectures }, null, 2)}\n`, { flag: "w" });
  const { rename } = await import("node:fs/promises");
  await rename(temporary, path);
}

export async function getArchitecture(id?: string): Promise<ArchitectureRegistration> {
  const entries = await readRegistry();
  if (!id && entries.length !== 1) {
    throw new Error(entries.length === 0
      ? "No architecture is registered; call arch_register first"
      : "More than one architecture is registered; provide the doc id");
  }
  const result = id ? entries.find((entry) => entry.id === id) : entries[0];
  if (!result) throw new Error(`No registered architecture named '${id}'`);
  return result;
}

export function normalizeArchitecturePath(path: string): string {
  return resolve(path);
}
