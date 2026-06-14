import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const PDF_DIR = path.join(process.cwd(), "pdfs");

async function ensureDir() {
  await mkdir(PDF_DIR, { recursive: true });
}

export async function savePdf(name: string, buffer: Buffer): Promise<string> {
  await ensureDir();
  const filename = `${name}.pdf`;
  await writeFile(path.join(PDF_DIR, filename), buffer);
  return `local://${filename}`;
}

export async function readPdf(key: string): Promise<Buffer> {
  if (key.startsWith("local://")) {
    return readFile(path.join(PDF_DIR, key.replace("local://", "")));
  }
  throw new Error(`Unknown storage key: ${key}`);
}

export function isLocalKey(key: string): boolean {
  return key.startsWith("local://");
}
