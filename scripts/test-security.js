#!/usr/bin/env node

/**
 * Security & Rate-Limit Test Suite for Mystic Builder
 * Usage:
 *   node scripts/test-security.js
 *   node scripts/test-security.js http://localhost:3000
 *   npm run test:security
 */

const http = require("http");
const https = require("https");

const BASE_URL = (process.argv[2] || process.env.TEST_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * Send a raw HTTP request without client-side URL normalization
 */
function rawRequest(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL);
        const transport = url.protocol === "https:" ? https : http;
        const req = transport.request(
            {
                hostname: url.hostname,
                port: url.port || (url.protocol === "https:" ? 443 : 80),
                path,
                method: "GET",
                headers,
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                });
            }
        );
        req.on("error", reject);
        req.end();
    });
}

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    dim: "\x1b[2m",
};

let totalTests = 0;
let passedTests = 0;

function header(title) {
    console.log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function pass(name, detail = "") {
    console.log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}${detail}${colors.reset}`);
}

function fail(name, detail = "") {
    console.log(`  ${colors.red}✗${colors.reset} ${name} ${colors.red}${detail}${colors.reset}`);
}

async function assertTest(name, fn) {
    totalTests++;
    try {
        await fn();
        pass(name);
        passedTests++;
    } catch (err) {
        fail(name, `(${err.message})`);
    }
}

async function main() {
    console.log(`${colors.bright}${colors.magenta}🛡️  Mystic Builder - Security & Rate-Limit Test Runner${colors.reset}`);
    console.log(`${colors.dim}Target URL: ${BASE_URL}${colors.reset}`);

    // --- 1. Security Headers ---
    header("1. Security HTTP Headers");
    await assertTest("Landing page returns HTTP 200 with required security headers", async () => {
        const res = await fetch(`${BASE_URL}/`);
        if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);

        const headers = res.headers;
        const xFrame = headers.get("x-frame-options");
        const xContent = headers.get("x-content-type-options");
        const referrer = headers.get("referrer-policy");
        const permissions = headers.get("permissions-policy");

        if (xFrame !== "SAMEORIGIN") throw new Error(`X-Frame-Options: expected SAMEORIGIN, got ${xFrame}`);
        if (xContent !== "nosniff") throw new Error(`X-Content-Type-Options: expected nosniff, got ${xContent}`);
        if (!referrer?.includes("strict-origin")) throw new Error(`Referrer-Policy: expected strict-origin, got ${referrer}`);
        if (!permissions?.includes("camera=()")) throw new Error(`Permissions-Policy: missing camera=(), got ${permissions}`);
    });

    // --- 2. Scanner & Exploit Probing Protection ---
    header("2. Scanner & Exploit Probing Defense (HTTP 403 Forbidden)");
    const probePaths = [
        "/.env",
        "/.git/config",
        "/.aws/credentials",
        "/wp-admin",
        "/wp-login.php",
        "/xmlrpc.php",
        "/phpmyadmin",
        "/eval-stdin",
        "/shell.php",
        "/backup.sql",
        "/etc/passwd",
    ];

    for (const p of probePaths) {
        await assertTest(`Probing '${p}' is immediately blocked with 403 Forbidden`, async () => {
            const res = await fetch(`${BASE_URL}${p}`);
            if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got HTTP ${res.status}`);
        });
    }

    // --- 3. Path Traversal & Long URI Checks ---
    header("3. Input Sanitization & Anomaly Protection");
    await assertTest("Query parameter traversal ('?file=../../etc/passwd') is rejected with HTTP 400 Bad Request", async () => {
        const res = await fetch(`${BASE_URL}/builder?file=../../etc/passwd`);
        if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got HTTP ${res.status}`);
    });

    await assertTest("Encoded traversal ('?file=%2e%2e%2f%2e%2e%2fetc') is rejected with HTTP 400 Bad Request", async () => {
        const res = await fetch(`${BASE_URL}/builder?file=%2e%2e%2f%2e%2e%2fetc`);
        if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got HTTP ${res.status}`);
    });

    await assertTest("Excessive URI length (>2048 chars) is rejected with HTTP 414", async () => {
        const longQuery = "a".repeat(2100);
        const res = await fetch(`${BASE_URL}/builder?q=${longQuery}`);
        if (res.status !== 414) throw new Error(`Expected 414 URI Too Long, got HTTP ${res.status}`);
    });

    // --- 4. Custom 404 Themed Page ---
    header("4. Custom Mystic Paradox 404 Page");
    await assertTest("Non-existent route returns HTTP 404 and rendered custom theme content", async () => {
        const testPath = `/missing-island-${Date.now()}`;
        const res = await fetch(`${BASE_URL}${testPath}`);
        if (res.status !== 404) throw new Error(`Expected 404 Not Found, got HTTP ${res.status}`);

        const text = await res.text();
        const hasAetherBadge = text.includes("Lost In The Aetheric Void") || text.includes("404");
        const hasTitle = text.includes("Coordinates Vanished in the Maelstrom") || text.includes("Build Planner");

        if (!hasAetherBadge && !hasTitle) {
            throw new Error("Response body does not contain expected custom 404 page content");
        }
    });

    // --- 5. Rate Limiting Tests ---
    header("5. Sliding-Window Rate Limiting & Throttling");
    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const mutationUrl = `${BASE_URL}/api/builds/likes`;

    await assertTest(`Initial API request returns HTTP 200 and rate-limit headers (IP: ${testIp})`, async () => {
        const res = await fetch(mutationUrl, {
            headers: { "X-Forwarded-For": testIp },
        });
        if (res.status !== 200) throw new Error(`Expected 200 OK, got HTTP ${res.status}`);

        const limit = res.headers.get("x-ratelimit-limit");
        const remaining = res.headers.get("x-ratelimit-remaining");
        const reset = res.headers.get("x-ratelimit-reset");

        if (!limit || limit !== "30") throw new Error(`Expected X-RateLimit-Limit: 30, got ${limit}`);
        if (!remaining) throw new Error("Missing X-RateLimit-Remaining header");
        if (!reset) throw new Error("Missing X-RateLimit-Reset header");
    });

    await assertTest(`Exceeding 30 requests throttles with HTTP 429 & Retry-After (IP: ${testIp})`, async () => {
        console.log(`    ${colors.dim}Sending 32 rapid requests to trigger throttle threshold...${colors.reset}`);
        let lastStatus = 200;
        let lastHeaders = null;
        let lastBody = null;

        for (let i = 0; i < 32; i++) {
            const res = await fetch(mutationUrl, {
                headers: { "X-Forwarded-For": testIp },
            });
            lastStatus = res.status;
            lastHeaders = res.headers;
            if (res.status === 429) {
                lastBody = await res.json().catch(() => null);
                break;
            }
        }

        if (lastStatus !== 429) {
            throw new Error(`Expected HTTP 429 Too Many Requests, got HTTP ${lastStatus}`);
        }

        const retryAfter = lastHeaders.get("retry-after");
        if (!retryAfter) throw new Error("Missing Retry-After header on 429 response");

        if (!lastBody?.error?.includes("Too many requests")) {
            throw new Error(`Unexpected error message in 429 response: ${JSON.stringify(lastBody)}`);
        }
    });

    // --- 6. Per-IP Isolation ---
    header("6. Rate Limit Per-IP Isolation");
    const freshIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`;
    await assertTest(`Fresh IP (${freshIp}) is NOT blocked despite previous IP being rate-limited`, async () => {
        const res = await fetch(mutationUrl, {
            headers: { "X-Forwarded-For": freshIp },
        });
        if (res.status !== 200) {
            throw new Error(`Expected HTTP 200 for independent IP, got HTTP ${res.status}`);
        }
        const remaining = res.headers.get("x-ratelimit-remaining");
        if (remaining !== "29") {
            throw new Error(`Expected X-RateLimit-Remaining: 29 for fresh IP, got ${remaining}`);
        }
    });

    // --- Summary ---
    console.log(`\n${colors.bright}------------------------------------------------------------${colors.reset}`);
    if (passedTests === totalTests) {
        console.log(`${colors.green}${colors.bright}🎉 All ${totalTests} security & rate-limit tests PASSED successfully!${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${colors.red}${colors.bright}⚠️  ${totalTests - passedTests} of ${totalTests} tests FAILED.${colors.reset}\n`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
});
