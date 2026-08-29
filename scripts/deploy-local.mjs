// Manual deploy: same gates as CI, same order, then push gated output to
// adbarc92.github.io. Any gate failure aborts before the target repo is
// even cloned. Run from the repo root:
//   npm run deploy
import { execSync, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const TARGET = "adbarc92/adbarc92.github.io";
// fixed literal strings only — nothing interpolated into a shell
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
// anything carrying a variable goes through an argv array, no shell
const git = (args, opts = {}) =>
  execFileSync("git", args, { stdio: "inherit", ...opts });
const gitOut = (args, opts = {}) =>
  execFileSync("git", args, { encoding: "utf8", ...opts }).trim();

// ---- gates first; a throw here aborts before anything touches the target
run("npm run build");
run("node scripts/content-gate.mjs --selftest");
run("node scripts/content-gate.mjs"); // fail-closed on an empty term list

// ---- provenance for the deploy commit
const sha = gitOut(["rev-parse", "--short", "HEAD"]);
const dirty = gitOut(["status", "--porcelain"]) === "" ? "" : "+dirty";

// ---- replace target repo contents with gated output
const work = mkdtempSync(path.join(tmpdir(), "treatise-deploy-"));
try {
  const site = path.join(work, "site");
  execFileSync("gh", ["repo", "clone", TARGET, site, "--", "--depth", "1"], {
    stdio: "inherit",
  });
  const cname = path.join(site, "CNAME");
  const savedCname = existsSync(cname)
    ? gitOut(["-C", site, "show", "HEAD:CNAME"])
    : null;

  // v1 = the last commit of the old portfolio, v2 = this replacement
  const tagExists = (t) =>
    gitOut(["-C", site, "ls-remote", "--tags", "origin", `refs/tags/${t}`]) !== "";
  if (!tagExists("v1")) git(["-C", site, "tag", "v1"]);

  git(["-C", site, "rm", "-rq", "."], { stdio: "ignore" });
  cpSync("dist", site, { recursive: true });
  writeFileSync(path.join(site, ".nojekyll"), "");
  if (savedCname) writeFileSync(cname, savedCname + "\n");
  cpSync("deploy-target/pages.yml", path.join(site, ".github", "workflows", "pages.yml"));

  git(["-C", site, "add", "-A"]);
  git(["-C", site, "commit", "-m", `deploy: portfolio v2 — the treatise (treatise@${sha}${dirty})`]);
  if (!tagExists("v2")) git(["-C", site, "tag", "v2"]);
  git(["-C", site, "push"]);
  git(["-C", site, "push", "origin", "--tags"]);
  console.log(`\ndeployed portfolio v2 (treatise@${sha}${dirty}) to ${TARGET} — Pages will publish it shortly.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
