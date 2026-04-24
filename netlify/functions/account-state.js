const { connectLambda, getStore } = require("@netlify/blobs");

const STORE_NAME = "urge-lab-user-state";
const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body)
  };
}

function parseIdentityUser(context) {
  try {
    const raw = context?.clientContext?.custom?.netlify;
    if (!raw) return null;
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return decoded?.user || null;
  } catch {
    return null;
  }
}

function normalizeState(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  return {
    sessions: Array.isArray(candidate.sessions) ? candidate.sessions : [],
    pledges: candidate.pledges || {},
    reflections: Array.isArray(candidate.reflections) ? candidate.reflections : [],
    focusLogs: Array.isArray(candidate.focusLogs) ? candidate.focusLogs : [],
    frictionLogs: Array.isArray(candidate.frictionLogs) ? candidate.frictionLogs : [],
    settings: candidate.settings && typeof candidate.settings === "object" ? candidate.settings : {}
  };
}

exports.handler = async function handler(event, context) {
  connectLambda(event);

  const user = parseIdentityUser(context);
  const userId = user?.sub || user?.id;
  if (!userId) {
    return response(401, { error: "Unauthorized. Valid Netlify Identity session required." });
  }

  const store = getStore(STORE_NAME);

  if (event.httpMethod === "GET") {
    const record = await store.get(userId, { type: "json" });
    return response(200, {
      state: record?.state || null,
      updatedAt: record?.updatedAt || "",
      user: {
        id: userId,
        email: user.email || ""
      }
    });
  }

  if (event.httpMethod === "PUT") {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return response(400, { error: "Invalid JSON body." });
    }

    const state = normalizeState(payload.state);
    if (!state) {
      return response(400, { error: "Missing state payload." });
    }

    const updatedAt = typeof payload.updatedAt === "string" && payload.updatedAt ? payload.updatedAt : new Date().toISOString();
    await store.setJSON(userId, {
      state,
      updatedAt,
      email: user.email || ""
    });

    return response(200, {
      ok: true,
      updatedAt
    });
  }

  return response(405, { error: "Method not allowed." });
};
