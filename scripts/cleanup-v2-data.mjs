const DIRECTUS_URL = (process.env.DIRECTUS_URL || "http://127.0.0.1:8057").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.BOOTSTRAP_TOKEN || "";

if (!DIRECTUS_TOKEN) {
  throw new Error("DIRECTUS_TOKEN or BOOTSTRAP_TOKEN must be provided.");
}

function log(message) {
  console.log(`[cleanup] ${message}`);
}

async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed: ${payload?.errors?.[0]?.message || payload?.error || response.statusText}`
    );
  }

  return payload;
}

async function fetchItems(collection, fields, limit = 200) {
  const query = new URLSearchParams({
    fields,
    limit: String(limit),
  });

  const response = await api(`/items/${collection}?${query.toString()}`);
  return Array.isArray(response?.data) ? response.data : [];
}

async function deleteItems(collection, ids) {
  if (!ids.length) return;

  for (const id of ids) {
    await api(`/items/${collection}/${id}`, {
      method: "DELETE",
    });
  }

  log(`Deleted ${ids.length} item(s) from ${collection}`);
}

async function deleteUsers(ids) {
  for (const id of ids) {
    await api(`/users/${id}`, { method: "DELETE" });
  }

  if (ids.length) {
    log(`Deleted ${ids.length} temporary user(s)`);
  }
}

async function deleteCollection(collection) {
  try {
    await api(`/collections/${collection}`, { method: "DELETE" });
    log(`Deleted legacy collection: ${collection}`);
  } catch (error) {
    if (String(error.message).includes("Forbidden")) {
      throw error;
    }

    log(`Skipped deleting collection ${collection}: ${error.message}`);
  }
}

function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function normalizeSessions() {
  const [sessions, logs] = await Promise.all([
    fetchItems(
      "sessions",
      "id,date_created,date_updated,date_end,last_activity_at,used_hints,question_count,hint_count,current_stage,status",
      500
    ),
    fetchItems("interrogation_logs", "id,related_session,date_created", 1000),
  ]);

  const logMap = new Map();

  for (const log of logs) {
    const sessionId = log?.related_session;
    if (!sessionId) continue;
    const current = logMap.get(sessionId) || [];
    current.push(log);
    logMap.set(sessionId, current);
  }

  for (const session of sessions) {
    const sessionLogs = logMap.get(session.id) || [];
    const derivedQuestionCount = sessionLogs.length;
    const derivedHintCount = Array.isArray(session.used_hints) ? session.used_hints.length : 0;
    const derivedCurrentStage =
      session.status === "completed"
        ? 4
        : derivedQuestionCount > 0 || derivedHintCount > 0
        ? 3
        : Number(session.current_stage || 1);
    const lastLogDate = sessionLogs
      .map((item) => toIsoDate(item.date_created))
      .filter(Boolean)
      .sort()
      .at(-1);
    const derivedLastActivity =
      lastLogDate ||
      toIsoDate(session.last_activity_at) ||
      toIsoDate(session.date_updated) ||
      toIsoDate(session.date_end) ||
      toIsoDate(session.date_created);

    const patch = {};

    if (Number(session.question_count || 0) !== derivedQuestionCount) {
      patch.question_count = derivedQuestionCount;
    }

    if (Number(session.hint_count || 0) !== derivedHintCount) {
      patch.hint_count = derivedHintCount;
    }

    if (Number(session.current_stage || 0) !== derivedCurrentStage) {
      patch.current_stage = derivedCurrentStage;
    }

    if (derivedLastActivity && toIsoDate(session.last_activity_at) !== derivedLastActivity) {
      patch.last_activity_at = derivedLastActivity;
    }

    if (Object.keys(patch).length > 0) {
      await api(`/items/sessions/${session.id}`, {
        method: "PATCH",
        body: patch,
      });

      log(`Normalized session ${session.id}`);
    }
  }
}

async function main() {
  const [relations, sessions, users, collections] = await Promise.all([
    fetchItems(
      "relations",
      "id,character,related_character,related_scenario",
      500
    ),
    fetchItems("sessions", "id,player,user_created,scenario", 500),
    api("/users?fields=id,email&limit=200"),
    api("/collections"),
  ]);

  const orphanRelationIds = relations
    .filter(
      (item) => !item?.related_scenario || !item?.character || !item?.related_character
    )
    .map((item) => item.id);

  await deleteItems("relations", orphanRelationIds);

  const temporaryUsers = (users.data || []).filter((item) =>
    String(item?.email || "").startsWith("codex.")
  );
  const temporaryUserIds = temporaryUsers.map((item) => item.id);
  const temporarySessionIds = sessions
    .filter((item) => temporaryUserIds.includes(item?.player))
    .map((item) => item.id);

  await deleteItems("sessions", temporarySessionIds);

  const orphanSessionIds = sessions
    .filter((item) => !temporarySessionIds.includes(item.id))
    .filter((item) => !item?.player || !item?.scenario)
    .map((item) => item.id);

  await deleteItems("sessions", orphanSessionIds);
  await deleteUsers(temporaryUserIds);

  const hasLegacyCollection = (collections.data || []).some(
    (item) => item.collection === "guilty_characters"
  );

  if (hasLegacyCollection) {
    await deleteCollection("guilty_characters");
  }

  await normalizeSessions();

  log("Cleanup completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
