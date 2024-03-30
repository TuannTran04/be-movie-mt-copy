"use strict";

const { promisify } = require("util");
const { getRedis } = require("../connections/init.redis");
const { instanceConnect: redisClient } = getRedis();

const setKeyString = async ({ key, value, expire }) => {
  console.log("value SET", { key, value, expire });
  const isOk = await redisClient.set(key, JSON.stringify(value), {
    NX: true,
    EX: expire,
  });
  console.log(`SET Cache ${key} is ok:::`, isOk);

  return isOk;
};

const getKeyString = async (key) => {
  let dataCache = await redisClient.get(key);
  console.log(`GET dataCache ${key} >>`, dataCache, typeof dataCache);

  return dataCache;
};

module.exports = {
  setKeyString,
  getKeyString,
};
