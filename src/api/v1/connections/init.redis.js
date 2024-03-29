"use strict";
const redis = require("redis");
const { RedisErrorResponse } = require("../core/error.response");

let client = {},
  statusConnectRedis = {
    CONNECT: "connect",
    END: "end",
    RECONNECT: "reconnecting",
    ERROR: "error",
  },
  connectionTimeout;

const REDIS_CONNECT_TIMEOUT = 10000,
  REDIS_CONNECT_MESSAGE = {
    code: -99,
    message: {
      vn: "loi roi anh oi!!!",
      en: "Service connection error",
    },
  };

const handleTimeoutError = () => {
  connectionTimeout = setTimeout(() => {
    throw new RedisErrorResponse({
      message: REDIS_CONNECT_MESSAGE.message.vn,
      statusCode: REDIS_CONNECT_MESSAGE.code,
    });
  }, REDIS_CONNECT_TIMEOUT);
};

const handleEventConnection = ({ connectionRedis }) => {
  // check if connection is null
  connectionRedis.on(statusConnectRedis.CONNECT, () => {
    console.log(`connection redis is - connected`);
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on(statusConnectRedis.END, () => {
    console.log(`connection redis is - disconnected`);
    // connect retry
    handleTimeoutError();
  });

  connectionRedis.on(statusConnectRedis.RECONNECT, () => {
    console.log(`connection redis is - reconnecting`);
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on(statusConnectRedis.ERROR, (err) => {
    console.log(`connection redis is - error ::: ${err}`);
    // connect retry
    handleTimeoutError();
  });
};

const initRedis = async () => {
  const instanceRedis = redis.createClient({
    password: "sRmJ2m69sf2fJ3U9p3Crj7yWjKNmS65v",
    socket: {
      host: "redis-16956.c11.us-east-1-3.ec2.cloud.redislabs.com",
      port: 16956,
    },
  });
  instanceRedis.connect();
  client.instanceConnect = instanceRedis;
  handleEventConnection({ connectionRedis: instanceRedis });
};

const getRedis = () => client;

const closeRedis = () => {};

module.exports = { initRedis, getRedis, closeRedis };
