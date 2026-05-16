import bodyParser from "body-parser";
import axios from "axios";
import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from "jose";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseAllowedOrigins(env) {
  const configuredOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const frontendOrigin = String(env.FRONTEND_URL || "").trim();
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, frontendOrigin, ...configuredOrigins])];
}

function extractOriginHost(value) {
  if (!value || typeof value !== "string") return "";
  try {
    return new URL(value).host;
  } catch (_error) {
    return value.trim();
  }
}

function isAllowedOrigin(allowedOrigins, origin, referer) {
  const allowedHosts = allowedOrigins.map(extractOriginHost).filter(Boolean);
  const requestHosts = [origin, referer].map(extractOriginHost).filter(Boolean);

  return requestHosts.some((requestHost) =>
    allowedHosts.some((allowedHost) => requestHost === allowedHost)
  );
}

function createOriginProtection(env) {
  const allowedOrigins = parseAllowedOrigins(env);
  const allowApiTestClients = parseBoolean(env.ALLOW_API_TEST_CLIENTS, false);
  const allowNativeMobileClients = parseBoolean(env.ALLOW_NATIVE_MOBILE_CLIENTS, true);

  return (req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const userAgent = String(req.headers["user-agent"] || "");
    const clientPlatform = String(req.headers["x-client-platform"] || "").toLowerCase();
    const isNativeMobileClient =
      allowNativeMobileClients && ["mobile", "ios", "android"].includes(clientPlatform);

    const isCliClient =
      userAgent.includes("Postman") ||
      userAgent.includes("insomnia") ||
      userAgent.includes("curl") ||
      userAgent.includes("HTTPie");

    if (isCliClient && !allowApiTestClients && !isNativeMobileClient) {
      return res.status(403).json({
        error: "API access from this client is not allowed",
        code: "FORBIDDEN_CLIENT",
      });
    }

    if (!origin && !referer && !allowApiTestClients && !isNativeMobileClient) {
      return res.status(403).json({
        error: "Cross-origin requests require proper headers",
        code: "MISSING_ORIGIN",
      });
    }

    if ((origin || referer) && !isAllowedOrigin(allowedOrigins, origin, referer)) {
      return res.status(403).json({
        error: "Access from this domain is not permitted",
        code: "DOMAIN_NOT_ALLOWED",
      });
    }

    return next();
  };
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || "unknown";
}

function createRateLimit({ windowMs, maxRequests }) {
  const requestStore = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `register:${getClientIp(req)}`;
    const currentEntry = requestStore.get(key);

    if (!currentEntry || now > currentEntry.resetAt) {
      requestStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    currentEntry.count += 1;
    requestStore.set(key, currentEntry);

    if (currentEntry.count > maxRequests) {
      res.set("Retry-After", String(Math.ceil((currentEntry.resetAt - now) / 1000)));
      return res.status(429).json({
        error: "Too many registration attempts. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    }

    return next();
  };
}

function isTestSocialLoginRequest(env, req) {
  return (
    parseBoolean(env.SOCIAL_LOGIN_TEST_MODE, false) &&
    String(req.body?.provider || "").trim().toLowerCase() === "test"
  );
}

function sanitizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizePassword(value) {
  return String(value || "");
}

function sanitizeProvider(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeName(value) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function logError(error, context) {
  if (error instanceof Error) {
    console.error(`[auth:${context}]`, error.message, error.stack);
    return;
  }

  console.error(`[auth:${context}]`, error);
}

async function findUserRoleId(RolesService, schema, accountability) {
  const rolesService = new RolesService({
    schema,
    accountability,
  });

  const rolesResult = await rolesService.readByQuery({
    fields: ["id", "name"],
    limit: 50,
  });

  const roles = Array.isArray(rolesResult) ? rolesResult : rolesResult?.data || [];
  const matchingRole =
    roles.find((role) => String(role.name || "").toLowerCase() === "user") || roles[0];

  return matchingRole?.id || null;
}

function createPlaceholderEmail(provider, subject) {
  const safeSubject = String(subject || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, 80);
  return `${provider}-${safeSubject}@social.detectivesimulator.com`;
}

function getExpectedAudiences(env, provider) {
  const keys =
    provider === "google"
      ? ["GOOGLE_WEB_CLIENT_ID", "GOOGLE_IOS_CLIENT_ID", "GOOGLE_ANDROID_CLIENT_ID"]
      : ["APPLE_CLIENT_ID", "APPLE_BUNDLE_ID", "IOS_BUNDLE_ID"];

  return keys
    .flatMap((key) =>
      String(env[key] || "")
        .split(",")
        .map((value) => value.trim())
    )
    .filter(Boolean);
}

function ensureAudienceAllowed(env, provider, audience) {
  const expectedAudiences = getExpectedAudiences(env, provider);
  if (expectedAudiences.length === 0) {
    return;
  }

  const audiences = Array.isArray(audience) ? audience : [audience];
  const hasMatch = audiences.some((item) => expectedAudiences.includes(item));
  if (!hasMatch) {
    throw new Error(`${provider} token audience is not allowed.`);
  }
}

async function verifyGoogleToken(env, identityToken) {
  const response = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
    params: { id_token: identityToken },
    timeout: Number(env.SOCIAL_AUTH_TIMEOUT_MS) || 10000,
  });

  const payload = response.data || {};
  if (!payload.sub) {
    throw new Error("Google token is missing subject.");
  }

  ensureAudienceAllowed(env, "google", payload.aud);

  return {
    provider: "google",
    subject: String(payload.sub),
    email: sanitizeEmail(payload.email),
    firstName: sanitizeName(payload.given_name),
    lastName: sanitizeName(payload.family_name),
  };
}

async function verifyAppleToken(env, identityToken) {
  const jwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
  const options = {
    issuer: "https://appleid.apple.com",
  };
  const expectedAudiences = getExpectedAudiences(env, "apple");
  if (expectedAudiences.length > 0) {
    options.audience = expectedAudiences;
  }

  const { payload } = await jwtVerify(identityToken, jwks, options);
  if (!payload.sub) {
    throw new Error("Apple token is missing subject.");
  }

  return {
    provider: "apple",
    subject: String(payload.sub),
    email: sanitizeEmail(payload.email),
    firstName: "",
    lastName: "",
  };
}

function signAccessToken(user, env) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      app_access: true,
      admin_access: false,
    },
    env.SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL || "15m",
      issuer: "directus",
    }
  );
}

async function findSocialUser(usersService, provider, subject) {
  const result = await usersService.readByQuery({
    filter: {
      provider: { _eq: provider },
      external_identifier: { _eq: subject },
    },
    fields: [
      "id",
      "email",
      "first_name",
      "last_name",
      "provider",
      "external_identifier",
      "role",
      "status",
    ],
    limit: 1,
  });

  const users = Array.isArray(result) ? result : result?.data || [];
  return users[0] || null;
}

async function resolveSocialProfile(env, body) {
  const provider = sanitizeProvider(body?.provider);
  const identityToken = String(body?.identityToken || "").trim();

  if (!["apple", "google", "test"].includes(provider)) {
    throw new Error("Unsupported social login provider.");
  }

  if (provider === "test" && parseBoolean(env.SOCIAL_LOGIN_TEST_MODE, false)) {
    const subject = sanitizeName(body?.subject) || "local-dev";
    return {
      provider: "test",
      subject,
      email: sanitizeEmail(body?.email) || createPlaceholderEmail("test", subject),
      firstName: "Test",
      lastName: "Detective",
    };
  }

  if (!identityToken) {
    throw new Error("Identity token is required.");
  }

  if (provider === "google") {
    return verifyGoogleToken(env, identityToken);
  }

  return verifyAppleToken(env, identityToken);
}

export default {
  id: "api",
  handler: (router, { env, services, getSchema }) => {
    const { UsersService, RolesService } = services;

    if (!env.ADMIN_USER_ID) {
      throw new Error("ADMIN_USER_ID is not set");
    }

    const adminAccountability = {
      id: env.ADMIN_USER_ID,
      admin: true,
    };

    const protectRoute = createOriginProtection(env);
    const registerRateLimit = createRateLimit({
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });
    const socialLoginRateLimit = (req, res, next) => {
      if (isTestSocialLoginRequest(env, req)) {
        return next();
      }

      return registerRateLimit(req, res, next);
    };

    router.use(bodyParser.json({ limit: "1mb" }));

    router.get("/health", (_req, res) => {
      return res.status(200).json({ status: "ok" });
    });

    router.post("/register", protectRoute, registerRateLimit, async (req, res) => {
      try {
        const email = sanitizeEmail(req.body?.email);
        const password = sanitizePassword(req.body?.password);

        if (!email || !password) {
          return res.status(400).json({ error: "Email and password are required." });
        }

        if (!isValidEmail(email)) {
          return res.status(400).json({ error: "Please enter a valid email address." });
        }

        if (password.length < 8) {
          return res.status(400).json({ error: "Password must be at least 8 characters." });
        }

        const schema = await getSchema();
        const usersService = new UsersService({
          schema,
          accountability: adminAccountability,
        });

        const existingUser = await usersService.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ error: "This email is already in use." });
        }

        const roleId = await findUserRoleId(RolesService, schema, adminAccountability);
        if (!roleId) {
          return res.status(500).json({ error: "User role is not configured." });
        }

        await usersService.createOne({
          email,
          password,
          role: roleId,
          status: "active",
        });

        return res.status(201).json({
          message: "User created successfully.",
        });
      } catch (error) {
        logError(error, "register");
        return res.status(500).json({
          error: "An error occurred while creating the user.",
        });
      }
    });

    router.post("/social-login", protectRoute, socialLoginRateLimit, async (req, res) => {
      try {
        const profile = await resolveSocialProfile(env, req.body);
        const schema = await getSchema();
        const usersService = new UsersService({
          schema,
          accountability: adminAccountability,
        });

        let user = await findSocialUser(usersService, profile.provider, profile.subject);

        if (!user && profile.email && isValidEmail(profile.email)) {
          user = await usersService.getUserByEmail(profile.email);
        }

        const roleId =
          user?.role || (await findUserRoleId(RolesService, schema, adminAccountability));
        if (!roleId) {
          return res.status(500).json({ error: "User role is not configured." });
        }

        const email =
          profile.email && isValidEmail(profile.email)
            ? profile.email
            : createPlaceholderEmail(profile.provider, profile.subject);

        if (!user) {
          const userId = await usersService.createOne({
            email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            provider: profile.provider,
            external_identifier: profile.subject,
            role: roleId,
            status: "active",
          });
          user = await usersService.readOne(userId, {
            fields: [
              "id",
              "email",
              "first_name",
              "last_name",
              "provider",
              "external_identifier",
              "role",
              "status",
            ],
          });
        } else if (
          user.provider !== profile.provider ||
          user.external_identifier !== profile.subject
        ) {
          await usersService.updateOne(user.id, {
            provider: profile.provider,
            external_identifier: profile.subject,
            first_name: user.first_name || profile.firstName,
            last_name: user.last_name || profile.lastName,
          });
          user = await usersService.readOne(user.id, {
            fields: [
              "id",
              "email",
              "first_name",
              "last_name",
              "provider",
              "external_identifier",
              "role",
              "status",
            ],
          });
        }

        if (user.status !== "active") {
          return res.status(403).json({ error: "User is not active." });
        }

        const accessToken = signAccessToken(user, env);
        return res.status(200).json({
          access_token: accessToken,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
          },
        });
      } catch (error) {
        logError(error, "social-login");
        return res.status(401).json({
          error: error instanceof Error ? error.message : "Social login failed.",
        });
      }
    });

    router.get("/user", protectRoute, async (req, res) => {
      try {
        if (!req.accountability?.user) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const schema = await getSchema();
        const usersService = new UsersService({
          schema,
          accountability: req.accountability,
        });

        const user = await usersService.readOne(req.accountability.user, {
          fields: ["id", "email", "first_name", "last_name", "status", "avatar"],
        });

        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({ user });
      } catch (error) {
        logError(error, "user");
        return res.status(500).json({
          error: "An error occurred while retrieving the user.",
        });
      }
    });
  },
};
