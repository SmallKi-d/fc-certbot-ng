"use strict";

const fs = require("node:fs");
const path = require("node:path");

const excludedDirectories = new Set([".git", ".s", "python", "node_modules", "__pycache__"]);

function includeSource(source) {
  const name = path.basename(source);
  if (excludedDirectories.has(name) || name.startsWith(".python-build.")) return false;
  if (name.startsWith(".env") && name !== ".env.example") return false;
  if (/\.(?:pyc|pem|key)$/i.test(name)) return false;
  // A release contains ordinary source files, never links to local files.
  return !fs.lstatSync(source).isSymbolicLink();
}

function prepareTemplate(root, output) {
  const manifest = path.join(root, "src", "s.yaml");
  if (!fs.existsSync(manifest)) {
    throw new Error("Missing src/s.yaml; run git submodule update --init --recursive");
  }
  if (fs.existsSync(output)) {
    throw new Error(`Release directory already exists: ${output}; move or remove it before rebuilding`);
  }
  const original = fs.readFileSync(manifest, "utf8");
  const resourcesIndex = original.indexOf("\nresources:\n");
  if (resourcesIndex < 0) throw new Error("Cannot find resources in src/s.yaml");
  const header = [
    "edition: 3.0.0",
    'access: "{{ access }}"',
    "vars:",
    '  fcDomainManagerFunctionName: "{{ fcDomainManagerFunctionName }}"',
    '  certGeneratorFunctionName: "{{ certGeneratorFunctionName }}"',
    '  role: "{{ role }}"',
    '  certbotEmail: "{{ certbotEmail }}"',
  ].join("\n");
  const template = header + original.slice(resourcesIndex);
  if (template.includes("${env(")) {
    throw new Error("Template still contains deployment environment expressions");
  }
  fs.mkdirSync(output, { recursive: true });
  fs.cpSync(path.join(root, "src"), path.join(output, "src"), {
    recursive: true, filter: includeSource,
  });
  fs.writeFileSync(path.join(output, "src", "s.yaml"), template);
  for (const file of ["publish.yaml", "version.md", "README.md"]) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
  }
  fs.copyFileSync(path.join(root, "README.md"), path.join(output, "readme.md"));
  fs.cpSync(path.join(root, "hook"), path.join(output, "hook"), { recursive: true });
  return template;
}

module.exports = { prepareTemplate };

if (require.main === module) {
  const root = path.resolve(__dirname, "..");
  const output = path.join(root, ".release", "fc-certbot-ng");
  prepareTemplate(root, output);
  console.log(`Template ready: ${output}`);
  console.log(`Publish from that directory with: s registry publish`);
}
