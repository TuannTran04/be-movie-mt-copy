"use strict";

const { findById } = require("../services/apikey.service");

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
};

const apiKey = async (req, res, next) => {
  try {
    const key = req.headers[HEADER.API_KEY]?.toString();
    console.log("key headers", req.headers);
    if (!key) {
      return res.status(403).json({
        message: "Forbidden Error 1",
      });
    }

    // check objkey
    const objKey = await findById(key);
    if (!objKey) {
      return res.status(403).json({
        message: "Forbidden Error 2",
      });
    }

    // gán objkey vảo request
    req.objKey = objKey;

    return next();
  } catch (error) {}
};

const permissions = (permission) => {
  // hàm closure, nhận vào các input của middlware trước đó
  return (req, res, next) => {
    if (!req.objKey.permissions) {
      return res.status(403).json({
        message: "permission denied",
      });
    }

    if (!req.objKey.permissions.includes(permission)) {
      return res.status(403).json({
        message: "permission denied",
      });
    }

    return next();
  };
};

module.exports = {
  apiKey,
  permissions,
};
