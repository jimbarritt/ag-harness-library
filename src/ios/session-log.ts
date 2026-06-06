#!/usr/bin/env tsx
/**
 * session-log: snapshot the current Claude Code session transcript into
 * doc/session-logs and print a summary for analysing how the harness performed.
 *
 * Run with: pnpm session-log
 *
 * Claude Code stores transcripts as JSONL under ~/.claude/projects/<project>/.
 * Those files are auto-deleted after 30 days, so we copy the latest one into the
 * repo (version-controlled) and compute harness metrics from it.
 */
import {
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { cwd } from "node:process";

const projectsDir = join(homedir(), ".claude", "projects");
if (!existsSync(projectsDir)) {
  console.error(`No Claude Code projects dir at ${projectsDir}. Nothing to log.`);
  process.exit(1);
}

// Recursively collect all .jsonl files under a directory.
function jsonlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...jsonlFiles(p));
    else if (entry.name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

// The project dir name is derived from the working directory path (slashes -> dashes).
// Naming has varied across Claude Code versions, so match defensively and fall back
// to the most-recently-modified project dir.
const dashed = cwd().replace(/\//g, "-");
const base = cwd().split("/").filter(Boolean).pop() ?? "";
const projectDirs = readdirSync(projectsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(projectsDir, d.name));

let candidates = projectDirs.filter(
  (p) => p.endsWith(dashed) || (base.length > 0 && p.includes(base)),
);
if (candidates.length === 0) candidates = projectDirs; // fall back to all

const allJsonl = candidates
  .flatMap(jsonlFiles)
  .map((f) => ({ f, mtime: statSync(f).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (allJsonl.length === 0) {
  console.error("No session transcripts found. Has Claude Code run in this project yet?");
  process.exit(1);
}

const transcript = allJsonl[0].f;
const sessionId = transcript.split("/").pop()!.replace(/\.jsonl$/, "");

// Snapshot into doc/session-logs
const logsDir = join(cwd(), "doc", "session-logs");
if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = join(logsDir, `session-${stamp}-${sessionId.slice(0, 8)}.jsonl`);
copyFileSync(transcript, dest);

// --- Analyse -----------------------------------------------------------
const lines = readFileSync(transcript, "utf8").split("\n").filter(Boolean);

let userMsgs = 0;
let assistantMsgs = 0;
const toolCalls = new Map<string, number>();
let firstTs: number | null = null;
let lastTs: number | null = null;

// Keyword tallies are schema-drift-proof: scan the raw line.
const kw = {
  xcodegen: 0,
  xcodebuild_build: 0,
  xcodebuild_test: 0,
  simctl: 0,
  buildSucceeded: 0,
  buildFailed: 0,
  testsPassed: 0,
  testsFailed: 0,
  gitCommit: 0,
  errors: 0,
};

for (const line of lines) {
  let obj: any;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }

  const role = obj?.message?.role ?? obj?.type;
  if (role === "user") userMsgs++;
  else if (role === "assistant") assistantMsgs++;

  const ts = Date.parse(obj?.timestamp ?? "");
  if (!Number.isNaN(ts)) {
    firstTs ??= ts;
    lastTs = ts;
  }

  // Count tool_use blocks by name if present.
  const content = obj?.message?.content;
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block?.type === "tool_use" && block?.name) {
        toolCalls.set(block.name, (toolCalls.get(block.name) ?? 0) + 1);
      }
    }
  }

  // Keyword scan on the raw line (covers tool inputs and outputs).
  if (/xcodegen/.test(line)) kw.xcodegen++;
  if (/xcodebuild[^"]*\btest\b/.test(line)) kw.xcodebuild_test++;
  else if (/xcodebuild[^"]*\bbuild\b/.test(line)) kw.xcodebuild_build++;
  if (/simctl/.test(line)) kw.simctl++;
  if (/BUILD SUCCEEDED/.test(line)) kw.buildSucceeded++;
  if (/BUILD FAILED/.test(line)) kw.buildFailed++;
  if (/Test Suite.*passed|\*\* TEST SUCCEEDED/.test(line)) kw.testsPassed++;
  if (/\*\* TEST FAILED|Test Suite.*failed/.test(line)) kw.testsFailed++;
  if (/git commit/.test(line)) kw.gitCommit++;
  if (/\berror:|BUILD FAILED|TEST FAILED/i.test(line)) kw.errors++;
}

const durationMin =
  firstTs !== null && lastTs !== null ? ((lastTs - firstTs) / 60000).toFixed(1) : "?";

console.log("\n  Session log snapshot");
console.log("  " + "-".repeat(46));
console.log(`  source     ${transcript}`);
console.log(`  saved to   ${dest}`);
console.log(`  session    ${sessionId}`);
console.log("  " + "-".repeat(46));
console.log(`  messages         user ${userMsgs} / assistant ${assistantMsgs}`);
console.log(`  duration (min)   ${durationMin}`);
console.log(`  xcodegen runs    ${kw.xcodegen}`);
console.log(`  build attempts   ${kw.xcodebuild_build}   (succeeded ${kw.buildSucceeded}, failed ${kw.buildFailed})`);
console.log(`  test attempts    ${kw.xcodebuild_test}   (passed ${kw.testsPassed}, failed ${kw.testsFailed})`);
console.log(`  simctl calls     ${kw.simctl}`);
console.log(`  git commits      ${kw.gitCommit}`);
console.log(`  error lines      ${kw.errors}`);
if (toolCalls.size > 0) {
  console.log("  tool calls       " +
    [...toolCalls.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}:${c}`).join("  "));
}
console.log("  " + "-".repeat(46));
console.log("  Build-failed-to-succeeded ratio is a rough proxy for how many");
console.log("  loop iterations the harness needed to reach green.\n");
