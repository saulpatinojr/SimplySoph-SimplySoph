"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logWarn = exports.logInfo = void 0;
const functions = __importStar(require("firebase-functions"));
const MAX_STRING_LEN = 240;
function clip(value) {
    return value.length > MAX_STRING_LEN
        ? `${value.slice(0, MAX_STRING_LEN)}...`
        : value;
}
function redactText(value) {
    return clip(value
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
        .replace(/\b(Bearer\s+)?[A-Za-z0-9_-]{20,}\b/g, "[redacted-token]")
        .replace(/(api[_-]?key|token|access[_-]?token|refresh[_-]?token|password|secret)=([^&\s]+)/gi, "$1=[redacted]"));
}
function sanitizeValue(value, depth = 0) {
    if (depth > 4)
        return "[truncated-depth]";
    if (typeof value === "string")
        return redactText(value);
    if (typeof value === "number" || typeof value === "boolean" || value == null) {
        return value;
    }
    if (value instanceof Error) {
        return {
            name: redactText(value.name || "Error"),
            message: redactText(value.message || "Unknown error"),
            stack: value.stack ? redactText(value.stack) : undefined,
        };
    }
    if (Array.isArray(value)) {
        return value.slice(0, 20).map(item => sanitizeValue(item, depth + 1));
    }
    if (typeof value === "object") {
        const out = {};
        const entries = Object.entries(value).slice(0, 40);
        for (const [key, entryValue] of entries) {
            out[key] = sanitizeValue(entryValue, depth + 1);
        }
        return out;
    }
    return redactText(String(value));
}
function writeLog(level, event, context) {
    const payload = Object.assign({ event }, (context ? sanitizeValue(context) : {}));
    if (level === "info") {
        functions.logger.info(event, payload);
        return;
    }
    if (level === "warn") {
        functions.logger.warn(event, payload);
        return;
    }
    functions.logger.error(event, payload);
}
function logInfo(event, context) {
    writeLog("info", event, context);
}
exports.logInfo = logInfo;
function logWarn(event, context) {
    writeLog("warn", event, context);
}
exports.logWarn = logWarn;
function logError(event, context) {
    writeLog("error", event, context);
}
exports.logError = logError;
//# sourceMappingURL=telemetry.js.map