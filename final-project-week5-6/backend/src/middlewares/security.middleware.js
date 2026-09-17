const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

module.exports = [
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
  xss(),
  mongoSanitize(),
  hpp(),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
  }),
];
