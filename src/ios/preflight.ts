#!/usr/bin/env tsx
/**
 * Preflight: verify this Mac can run the iOS build harness.
 * Run with: pnpm preflight
 * Exits non-zero if any HARD prerequisite is missing.
 */
import { execSync } from "node:child_process";
import { arch, platform } from "node:process";

type Severity = "hard" | "soft";
interface Result {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
  severity: Severity;
}

const results: Result[] = [];

function run(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function check(
  name: string,
  severity: Severity,
  fn: () => { ok: boolean; detail: string; fix?: string },
) {
  try {
    const { ok, detail, fix } = fn();
    results.push({ name, ok, detail, fix, severity });
  } catch (e) {
    results.push({
      name,
      ok: false,
      detail: `check threw: ${(e as Error).message}`,
      severity,
    });
  }
}

// --- Host ---------------------------------------------------------------
check("macOS host", "hard", () => {
  const ok = platform === "darwin";
  return {
    ok,
    detail: ok ? "running on macOS" : `platform is '${platform}', not darwin`,
    fix: "This harness only runs on macOS (Xcode + iOS Simulator are Mac-only).",
  };
});

check("Apple Silicon", "soft", () => {
  const ok = arch === "arm64";
  return {
    ok,
    detail: `arch = ${arch}`,
    fix: "Apple Silicon is required for on-device Apple Intelligence (Foundation Models) at the device-checkpoint stage. Intel is fine for the Simulator-only deltas.",
  };
});

check("macOS version", "soft", () => {
  const v = run("sw_vers -productVersion") ?? "unknown";
  const major = parseInt(v.split(".")[0] ?? "0", 10);
  const ok = major >= 26;
  return {
    ok,
    detail: `macOS ${v}`,
    fix: "macOS 26 (Tahoe)+ is needed later for Foundation Models / iOS 26 SDK. Earlier macOS can still run the early Simulator deltas.",
  };
});

// --- Toolchain ----------------------------------------------------------
check("Node.js", "hard", () => {
  const v = run("node --version");
  return {
    ok: v !== null,
    detail: v ? `node ${v}` : "node not found",
    fix: "Install Node.js (Claude Code requires it anyway).",
  };
});

check("pnpm", "hard", () => {
  const v = run("pnpm --version");
  return {
    ok: v !== null,
    detail: v ? `pnpm ${v}` : "pnpm not found",
    fix: "Install pnpm: `npm i -g pnpm` or `corepack enable`.",
  };
});

check("git", "hard", () => {
  const v = run("git --version");
  return {
    ok: v !== null,
    detail: v ?? "git not found",
    fix: "Install git (ships with the Xcode command line tools).",
  };
});

check("Homebrew", "soft", () => {
  const v = run("brew --version");
  return {
    ok: v !== null,
    detail: v?.split("\n")[0] ?? "brew not found",
    fix: "Install Homebrew (https://brew.sh) — used to install XcodeGen.",
  };
});

// --- Xcode --------------------------------------------------------------
check("Xcode (full, not just CLT)", "hard", () => {
  const v = run("xcodebuild -version");
  const path = run("xcode-select -p") ?? "";
  const isFullXcode = path.includes("Xcode.app");
  const ok = v !== null && isFullXcode;
  return {
    ok,
    detail: ok
      ? `${v?.split("\n")[0]} @ ${path}`
      : v === null
        ? "xcodebuild not runnable"
        : `xcode-select points at '${path}', not a full Xcode`,
    fix: "Install Xcode from the App Store (or `xcodes`), then `sudo xcode-select -s /Applications/Xcode.app` and accept the licence: `sudo xcodebuild -license accept`.",
  };
});

check("xcrun / simctl", "hard", () => {
  const v = run("xcrun simctl help");
  return {
    ok: v !== null,
    detail: v !== null ? "simctl available" : "simctl not available",
    fix: "Comes with Xcode; ensure xcode-select points at full Xcode.",
  };
});

check("Available iOS simulators", "hard", () => {
  const list = run("xcrun simctl list devices available") ?? "";
  const hasIPhone = /iPhone/.test(list);
  return {
    ok: hasIPhone,
    detail: hasIPhone
      ? "at least one iPhone simulator available"
      : "no available iPhone simulators",
    fix: "Open Xcode > Settings > Components and download an iOS runtime/simulator.",
  };
});

check("Swift", "hard", () => {
  const v = run("swift --version");
  return {
    ok: v !== null,
    detail: v?.split("\n")[0] ?? "swift not found",
    fix: "Comes with Xcode.",
  };
});

check("XcodeGen", "soft", () => {
  const v = run("xcodegen --version");
  return {
    ok: v !== null,
    detail: v ? `xcodegen ${v}` : "xcodegen not found",
    fix: "Install: `brew install xcodegen`. (Soft because the agent can install it during scaffolding.)",
  };
});

check("just", "soft", () => {
  const v = run("just --version");
  return {
    ok: v !== null,
    detail: v ? `${v}` : "just not found",
    fix: "Install: `brew install just`. Needed to run the generated justfile recipes (run-local, deploy-local, publish).",
  };
});

// --- Report -------------------------------------------------------------
console.log("\n  iOS Build Harness — preflight\n  " + "-".repeat(40));
let hardFails = 0;
for (const r of results) {
  const mark = r.ok ? "PASS" : r.severity === "hard" ? "FAIL" : "WARN";
  console.log(`  [${mark}] ${r.name.padEnd(30)} ${r.detail}`);
  if (!r.ok) {
    if (r.severity === "hard") hardFails++;
    if (r.fix) console.log(`         ↳ ${r.fix}`);
  }
}
console.log("  " + "-".repeat(40));

if (hardFails > 0) {
  console.log(`\n  ${hardFails} hard prerequisite(s) missing. Fix the above, then re-run.\n`);
  process.exit(1);
}
console.log("\n  All hard prerequisites satisfied. Ready to scaffold.\n");
process.exit(0);
