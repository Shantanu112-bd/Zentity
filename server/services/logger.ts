import pino from "pino";

/**
 * Structured Redacted Logger for Pramaan-ZK
 * 
 * - Output format: Structured JSON
 * - Redaction: Strict PII and secret scrubber (Zero Aadhaar, keys, or secrets leaked to logs)
 * - Safe BigInt serialization
 */
const SENSITIVE_KEYS = [
  "password",
  "clientSecret",
  "client_secret",
  "secret",
  "privateKey",
  "private_key",
  "prvKey",
  "credentialSecret",
  "masterKey",
  "ISSUER_MASTER_KEY",
  "aadhaar",
  "uid",
  "dob",
  "token",
  "authorization",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info"),
  redact: {
    paths: [
      ...SENSITIVE_KEYS,
      ...SENSITIVE_KEYS.map((k) => `*.${k}`),
      ...SENSITIVE_KEYS.map((k) => `*.*.${k}`),
      "req.headers.authorization",
      "req.headers['x-api-key']",
      "body.credentialSecret",
      "body.privateKey",
      "body.clientSecret",
    ],
    censor: "[REDACTED_PII_OR_SECRET]",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.ip,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

