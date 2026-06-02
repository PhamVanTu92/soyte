import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function parseArgv(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = "true";
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  }

  return env;
}

function resolveDefaultToken() {
  const importScript = path.join(cwd, "scripts", "import_facilities.ts");
  if (!fs.existsSync(importScript)) return "";

  const content = fs.readFileSync(importScript, "utf8");
  const match = content.match(/const AUTH_TOKEN\s*=\s*"([^"]+)"/);
  return match?.[1] || "";
}

function parseJsonSafe(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function summarizeShape(value, depth = 0) {
  if (depth > 4) return "...";
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return ["empty-array"];
    return [summarizeShape(value[0], depth + 1)];
  }
  if (typeof value === "object") {
    const result = {};
    for (const [key, inner] of Object.entries(value)) {
      result[key] = summarizeShape(inner, depth + 1);
    }
    return result;
  }
  return typeof value;
}

function trimForPreview(value, maxLength = 4000) {
  const serialized = JSON.stringify(value, null, 2);
  if (serialized.length <= maxLength) return serialized;
  return `${serialized.slice(0, maxLength)}\n... <truncated>`;
}

function withDefinedEntries(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== "")
  );
}

function buildQuery(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function requestJson({ method, url, token, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data,
  };
}

function printHelp() {
  console.log(`
Usage:
  node scripts/inspect_feedback_apis.mjs [options]

Options:
  --base-url <url>              API base url. Default lấy từ .env.dev -> VITE_API_URL
  --token <jwt>                 Auth token. Nếu thiếu sẽ thử đọc FEEDBACKS_AUTH_TOKEN/AUTH_TOKEN hoặc scripts/import_facilities.ts
  --type <reflect|evaluate>
  --survey-key <key>
  --unit-id <id>
  --unit-type <type>
  --unit <legacyUnitParam>
  --form-id <id>
  --report-type <1|2|3>
  --feedback-id <id>
  --page <n>
  --limit <n>
  --start-date <YYYY-MM-DD>
  --end-date <YYYY-MM-DD>
  --only <csv>                  list,list-post,stats,stats-post,compare,compare-post,check-unit,detail,create,delete
  --include-mutations           Cho phép gọi create/delete nếu đã truyền đủ dữ liệu
  --create-body <json|@file>    JSON body cho POST /feedbacks
  --delete-id <id>              Id dùng cho DELETE /feedbacks/{id}
  --write                       Ghi kết quả ra scripts/output/feedback-api-snapshot-<timestamp>.json
  --help

Examples:
  node scripts/inspect_feedback_apis.mjs --type reflect --survey-key ks_2026 --page 1 --limit 5 --write
  node scripts/inspect_feedback_apis.mjs --type evaluate --survey-key ks_2026 --report-type 1 --unit-id 123
  node scripts/inspect_feedback_apis.mjs --only detail --feedback-id 1001
`);
}

function resolveCreateBody(rawValue) {
  if (!rawValue) return undefined;
  if (rawValue.startsWith("@")) {
    const filePath = path.resolve(cwd, rawValue.slice(1));
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return JSON.parse(rawValue);
}

async function main() {
  const args = parseArgv(process.argv.slice(2));
  if (args.help === "true") {
    printHelp();
    return;
  }

  const env = {
    ...loadEnvFile(path.join(cwd, ".env")),
    ...loadEnvFile(path.join(cwd, ".env.dev")),
    ...process.env,
  };

  const baseUrl = (args["base-url"] || env.VITE_API_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("Thiếu base URL. Hãy truyền --base-url hoặc cấu hình VITE_API_URL.");
  }

  const token =
    args.token ||
    env.FEEDBACKS_AUTH_TOKEN ||
    env.AUTH_TOKEN ||
    resolveDefaultToken();

  const page = Number(args.page || 1);
  const limit = Number(args.limit || 10);
  const type = args.type || "reflect";
  const surveyKey = args["survey-key"] || "";
  const unitId = args["unit-id"] || "";
  const unitType = args["unit-type"] || "";
  const unit = args.unit || "";
  const formId = args["form-id"] || "";
  const reportType = args["report-type"] || "";
  const feedbackId = args["feedback-id"] || "";
  const deleteId = args["delete-id"] || "";
  const startDate = args["start-date"] || "";
  const endDate = args["end-date"] || "";
  const includeMutations = args["include-mutations"] === "true";
  const selected = new Set(
    (args.only || "list,list-post,stats,stats-post,compare,compare-post,check-unit,detail")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const commonQuery = withDefinedEntries({
    page,
    limit,
    type,
    survey_key: surveyKey,
    unit_id: unitId,
    unit_type: unitType,
    unit,
    startDate,
    endDate,
  });

  const commonBody = withDefinedEntries({
    type,
    survey_key: surveyKey,
    unit_id: unitId,
    unit_type: unitType,
    unit,
    page,
    limit,
    startDate,
    endDate,
  });

  const createBody = resolveCreateBody(args["create-body"]);
  const createEnabled = includeMutations && selected.has("create") && createBody;
  const deleteEnabled = includeMutations && selected.has("delete") && deleteId;

  const endpointConfigs = [
    {
      key: "list",
      method: "GET",
      url: buildQuery(`${baseUrl}/feedbacks`, commonQuery),
    },
    {
      key: "list-post",
      method: "POST",
      url: `${baseUrl}/feedbacks/list`,
      body: commonBody,
    },
    {
      key: "stats",
      method: "GET",
      url: buildQuery(
        `${baseUrl}/feedbacks/stats`,
        withDefinedEntries({
          type,
          survey_key: surveyKey,
          report_type: reportType,
          unit_id: unitId,
          unit_type: unitType,
          unit,
          startDate,
          endDate,
        })
      ),
    },
    {
      key: "stats-post",
      method: "POST",
      url: `${baseUrl}/feedbacks/stats`,
      body: withDefinedEntries({
        type,
        survey_key: surveyKey,
        report_type: reportType,
        unit_id: unitId,
        unit_type: unitType,
        unit,
        startDate,
        endDate,
      }),
    },
    {
      key: "compare",
      method: "GET",
      url: buildQuery(
        `${baseUrl}/feedbacks/compare`,
        withDefinedEntries({
          type,
          survey_key: surveyKey,
          report_type: reportType,
          unit_id: unitId,
          unit_type: unitType,
          unit,
        })
      ),
    },
    {
      key: "compare-post",
      method: "POST",
      url: `${baseUrl}/feedbacks/compare`,
      body: withDefinedEntries({
        type,
        survey_key: surveyKey,
        report_type: reportType,
        unit_id: unitId,
        unit_type: unitType,
        unit,
      }),
    },
    {
      key: "check-unit",
      method: "GET",
      url: buildQuery(
        `${baseUrl}/feedbacks/check-unit`,
        withDefinedEntries({
          unit_id: unitId,
          type,
          survey_key: surveyKey,
          form_id: formId,
        })
      ),
      skip: !unitId,
      skipReason: "Thiếu --unit-id",
    },
    {
      key: "detail",
      method: "GET",
      url: `${baseUrl}/feedbacks/${feedbackId}`,
      skip: !feedbackId,
      skipReason: "Thiếu --feedback-id",
    },
    {
      key: "create",
      method: "POST",
      url: `${baseUrl}/feedbacks`,
      body: createBody,
      skip: !createEnabled,
      skipReason:
        "Bị tắt mặc định. Cần truyền --include-mutations và --create-body để gọi POST /feedbacks.",
    },
    {
      key: "delete",
      method: "DELETE",
      url: `${baseUrl}/feedbacks/${deleteId}`,
      skip: !deleteEnabled,
      skipReason:
        "Bị tắt mặc định. Cần truyền --include-mutations và --delete-id để gọi DELETE /feedbacks/{id}.",
    },
  ];

  const results = [];

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Token: ${token ? "provided" : "missing"}`);
  console.log(`Selected endpoints: ${Array.from(selected).join(", ")}`);

  for (const config of endpointConfigs) {
    if (!selected.has(config.key)) continue;

    if (config.skip) {
      const skipped = {
        endpoint: config.key,
        skipped: true,
        reason: config.skipReason,
      };
      results.push(skipped);
      console.log(`\n[SKIP] ${config.key}: ${config.skipReason}`);
      continue;
    }

    console.log(`\n[REQUEST] ${config.method} ${config.url}`);
    if (config.body) {
      console.log(`[BODY] ${trimForPreview(config.body, 1200)}`);
    }

    try {
      const response = await requestJson({
        method: config.method,
        url: config.url,
        token,
        body: config.body,
      });

      const result = {
        endpoint: config.key,
        method: config.method,
        url: config.url,
        requestBody: config.body || null,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        shape: summarizeShape(response.data),
        data: response.data,
      };

      results.push(result);

      console.log(`[RESPONSE] ${response.status} ${response.statusText}`);
      console.log(`[SHAPE] ${trimForPreview(result.shape, 1600)}`);
      console.log(`[SAMPLE] ${trimForPreview(response.data, 2000)}`);
    } catch (error) {
      const result = {
        endpoint: config.key,
        method: config.method,
        url: config.url,
        requestBody: config.body || null,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      results.push(result);
      console.error(`[ERROR] ${config.key}:`, result.error);
    }
  }

  if (args.write === "true") {
    const outputDir = path.join(cwd, "scripts", "output");
    fs.mkdirSync(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(
      outputDir,
      `feedback-api-snapshot-${timestamp}.json`
    );
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
    console.log(`\nSaved snapshot to ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
