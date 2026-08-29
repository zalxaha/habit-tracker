// lib/github.ts
// Simple wrapper around the GitHub Contents API used as the persistence
// layer for Starlog. The whole app state lives in one JSON file inside a
// GitHub repo (default: data/starlog.json), so every write is a
// read-sha -> write-with-sha round trip. Concurrent writes can race and
// get a 409, so writeData() retries with backoff.

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: "gold" | "ember" | "sage";
  createdAt: string;
  archived?: boolean;
  reminderTime?: string; // "HH:mm" — jam kebiasaan ini sebaiknya dilakukan
  schedule?: number[]; // hari dalam seminggu (0=Minggu..6=Sabtu); kosong/absen = tiap hari
  targetCount?: number; // target jumlah hari total yang ingin dicapai
  logs: Record<string, string>; // "YYYY-MM-DD" -> waktu ISO saat ditandai selesai
};

export type NoteCategory = "umum" | "ide" | "refleksi" | "tugas";
export const NOTE_CATEGORIES: NoteCategory[] = ["umum", "ide", "refleksi", "tugas"];

export type NoteType = "text" | "table";

export type NoteTable = {
  columns: string[];
  rows: string[][];
};

export type Note = {
  id: string;
  title: string;
  type: NoteType;
  content: string; // dipakai saat type "text"
  table?: NoteTable; // dipakai saat type "table"
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
};

export type StarlogData = {
  habits: Habit[];
  notes: Note[];
};

const EMPTY_DATA: StarlogData = { habits: [], notes: [] };

function env() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.GITHUB_DATA_PATH || "data/starlog.json";

  if (!token || !owner || !repo) {
    throw new Error(
      "Konfigurasi GitHub belum lengkap. Set GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO di environment variables."
    );
  }
  return { token, owner, repo, branch, path };
}

function apiUrl(owner: string, repo: string, path: string) {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
}

function b64encode(str: string) {
  return Buffer.from(str, "utf-8").toString("base64");
}

function b64decode(str: string) {
  return Buffer.from(str, "base64").toString("utf-8");
}

async function getFile(): Promise<{ data: StarlogData; sha: string | null }> {
  const { token, owner, repo, branch, path } = env();

  const res = await fetch(`${apiUrl(owner, repo, path)}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (res.status === 404) {
    // File belum ada — anggap data kosong, sha null berarti "buat baru".
    return { data: EMPTY_DATA, sha: null };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal membaca data dari GitHub (${res.status}): ${text}`);
  }

  const json = await res.json();
  const content = b64decode(json.content.replace(/\n/g, ""));
  let data: StarlogData;
  try {
    data = JSON.parse(content);
  } catch {
    data = EMPTY_DATA;
  }
  return { data: { habits: data.habits || [], notes: data.notes || [] }, sha: json.sha };
}

async function putFile(data: StarlogData, sha: string | null): Promise<void> {
  const { token, owner, repo, branch, path } = env();

  const body: Record<string, unknown> = {
    message: `chore(starlog): update data — ${new Date().toISOString()}`,
    content: b64encode(JSON.stringify(data, null, 2)),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl(owner, repo, path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Gagal menyimpan data ke GitHub (${res.status}): ${text}`);
    (err as any).status = res.status;
    throw err;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readData(): Promise<StarlogData> {
  const { data } = await getFile();
  return data;
}

/**
 * Menulis data baru dengan retry + exponential backoff bila terjadi
 * konflik SHA (409) akibat penulisan bersamaan. `mutate` menerima data
 * terbaru dan mengembalikan data yang sudah diubah, sehingga tiap
 * percobaan ulang selalu bekerja di atas versi terbaru dari GitHub.
 */
export async function writeData(
  mutate: (current: StarlogData) => StarlogData
): Promise<StarlogData> {
  const maxAttempts = 5;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      const { data: current, sha } = await getFile();
      const next = mutate(current);
      await putFile(next, sha);
      return next;
    } catch (err: any) {
      lastError = err;
      const isConflict = err?.status === 409 || err?.status === 422;
      if (!isConflict) throw err;
      const backoff = 150 * Math.pow(2, attempt) + Math.random() * 100;
      await sleep(backoff);
      attempt += 1;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Gagal menyimpan data setelah beberapa percobaan.");
}
