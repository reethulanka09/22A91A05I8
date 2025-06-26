const allowedStacks = ["backend", "frontend"];
const allowedLevels = ["debug", "info", "warn", "error", "fatal"];
const backendPackages = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];
const frontendPackages = ["api", "component", "hook", "page", "state", "style"];
const commonPackages = ["auth", "config", "middleware", "utils"];

function isValid(stack, level, pkg) {
  const s = stack.toLowerCase();
  const l = level.toLowerCase();
  const p = pkg.toLowerCase();
  if (!allowedStacks.includes(s)) return false;
  if (!allowedLevels.includes(l)) return false;
  if (
    (s === "backend" && !(backendPackages.includes(p) || commonPackages.includes(p))) ||
    (s === "frontend" && !(frontendPackages.includes(p) || commonPackages.includes(p)))
  ) return false;
  return true;
}

async function Log(stack, level, pkg, message) {
  if (!isValid(stack, level, pkg)) return;

  const body = {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: pkg.toLowerCase(),
    message: message,
  };

  try {
    await fetch("http://20.244.56.144/evaluation-service/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {}
}

module.exports = Log;
