var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/waitlist.ts
var waitlist_exports = {};
__export(waitlist_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(waitlist_exports);
var waitlistEntries = /* @__PURE__ */ new Map();
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW = 60 * 60 * 1e3;
function validateEmail(email) {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}
function validateInput(data) {
  const errors = [];
  if (!data.fullName || data.fullName.length < 2 || data.fullName.length > 100) {
    errors.push("Full name must be between 2 and 100 characters");
  }
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Valid email address is required");
  }
  if (!data.organization || data.organization.length < 2 || data.organization.length > 200) {
    errors.push("Organization name must be between 2 and 200 characters");
  }
  return errors;
}
function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );
  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }
  recentTimestamps.push(now);
  rateLimitMap.set(ip, recentTimestamps);
  return true;
}
var handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Method not allowed"
      })
    };
  }
  try {
    const ip = event.headers["x-forwarded-for"]?.split(",")[0] || event.headers["client-ip"] || "unknown";
    if (!checkRateLimit(ip)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Too many requests. Please try again in a few minutes."
        })
      };
    }
    const data = JSON.parse(event.body || "{}");
    const validationErrors = validateInput(data);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Validation failed",
          errors: validationErrors
        })
      };
    }
    if (waitlistEntries.has(data.email.toLowerCase())) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          message: "This email is already on our waitlist. We'll be in touch soon!"
        })
      };
    }
    const entry = {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      contactNumber: data.contactNumber,
      organization: data.organization,
      timestamp: data.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      source: data.source || "website"
    };
    waitlistEntries.set(entry.email, entry);
    console.log("New waitlist entry:", {
      email: entry.email,
      organization: entry.organization,
      timestamp: entry.timestamp
    });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Successfully added to waitlist",
        id: entry.email
      })
    };
  } catch (error) {
    console.error("Error processing waitlist submission:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Something went wrong on our end. Please try again in a few moments."
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=waitlist.js.map
