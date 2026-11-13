"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { prepareTemplate } = require("./prepare-template");

test("release receives initialization parameters without modifying Git deployment source", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fc-certbot-template-"));
  try {
    const root = path.join(temp, "project");
    const sourceRoot = path.resolve(__dirname, "..");
    fs.mkdirSync(path.join(root, "src"), { recursive: true });
    for (const name of ["publish.yaml", "version.md", "README.md"]) {
      fs.copyFileSync(path.join(sourceRoot, name), path.join(root, name));
    }
    fs.cpSync(path.join(sourceRoot, "hook"), path.join(root, "hook"), { recursive: true });
    const original = fs.readFileSync(path.join(sourceRoot, "src/s.yaml"), "utf8");
    fs.writeFileSync(path.join(root, "src/s.yaml"), original);
    for (const name of ["python", "node_modules", ".git", "__pycache__", ".python-build.test"]) {
      fs.mkdirSync(path.join(root, "src", name));
      fs.writeFileSync(path.join(root, "src", name, "excluded"), "local-only");
    }
    for (const name of [".env", ".env.production", "secret.pem", "secret.key", "cache.pyc", ".env.example"]) {
      fs.writeFileSync(path.join(root, "src", name), "test");
    }
    fs.symlinkSync(path.join(root, "src/.env"), path.join(root, "src/local-link"));
    const output = path.join(temp, "release");
    const template = prepareTemplate(root, output);
    assert.equal(fs.readFileSync(path.join(root, "src/s.yaml"), "utf8"), original);
    assert(template.includes('role: "{{ role }}"'));
    assert(template.includes('certbotEmail: "{{ certbotEmail }}"'));
    assert(!template.includes("${env("));
    assert.equal(template.slice(template.indexOf("\nresources:\n")), original.slice(original.indexOf("\nresources:\n")));
    assert.deepEqual(fs.readdirSync(path.join(output, "src")).sort(), [".env.example", "s.yaml"]);
    const values = {
      access: "default", role: "acs:ram::1234567890123456:role/test-role",
      certbotEmail: "admin@example.com", certGeneratorFunctionName: "test-generator",
      fcDomainManagerFunctionName: "test-manager",
    };
    const rendered = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      assert(Object.hasOwn(values, key), key);
      return values[key];
    });
    assert(!rendered.includes("{{"));
    for (const value of Object.values(values)) assert(rendered.includes(value));
    assert.throws(() => prepareTemplate(root, output), /already exists/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
