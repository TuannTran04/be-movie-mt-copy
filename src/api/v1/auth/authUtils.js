"use strict";

const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../middleware/asyncHandler");
const { findByUserId } = require("../services/keyToken.service");
const { AuthFailureError, NotFoundError } = require("../core/error.response");

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization",
  REFRESHTOKEN: "x-rtoken-id",
};

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    //tạo accesstoken
    console.log(publicKey);
    console.log(privateKey);
    const accesstoken = await jwt.sign(payload, publicKey, {
      expiresIn: "2 days",
    });
    const refreshtoken = await jwt.sign(payload, privateKey, {
      expiresIn: "7 days",
    });
    // const accesstoken = await jwt.sign(payload, publicKey, {
    //   expiresIn: "2 days",
    // });
    // const refreshtoken = await jwt.sign(payload, privateKey, {
    //   expiresIn: "7 days",
    // });

    //verify
    // kí thì kí bằng private, trả private về cho user
    // user gửi private lên thì mình verify với public key của mình

    await jwt.verify(accesstoken, publicKey, (err, decode) => {
      if (err) {
        console.log(`error verify::`, err);
      } else {
        console.log(`decode verify::`, decode);
      }
    });

    return {
      accesstoken,
      refreshtoken,
    };
  } catch (error) {}
};

const authentication = asyncHandler(async (req, res, next) => {
  //1
  const userId = req.headers[HEADER.CLIENT_ID];
  nsole.log("authen userId", userId);

  if (!userId) throw new AuthFailureError("Invalid Request");

  //2
  const keyStore = await findByUserId(userId);
  console.log("authen keystore", keyStore);
  if (!keyStore) throw new NotFoundError("Not Found keyStore");
  console.log("authen req.cookies", JSON.stringify(req.cookies));

  //3
  if (req.cookies) {
    try {
      const refreshToken = req.cookies.refreshTokenJWT;
      console.log("authen keystore refreshToken", refreshToken);
      // const decodeUser = jwt.verify(refreshToken, keyStore.privateKey);
      const decodeUser = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
      console.log("authen keystore decodeUser", decodeUser);

      if (userId !== decodeUser.userId) {
        throw new AuthFailureError("invalid user id");
      }
      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = refreshToken;

      return next();
    } catch (error) {
      throw error;
    }
  }
});

const authenticationV2 = asyncHandler(async (req, res, next) => {
  /*
    1. check userId missing
    2. get access token
    3. verify token
    4. check user in bds
    5. check keystore with this userid
    6. ok all -> return next()
  */

  //1
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError("Invalid Request");

  //2
  const keyStore = await findByUserId(userId);
  console.log("authen keystore", keyStore);
  if (!keyStore) throw new NotFoundError("Not Found keyStore");

  //3
  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN];
      const decodeUser = jwt.verify(refreshToken, keyStore.privateKey);
      if (userId !== decodeUser.userId) {
        throw new AuthFailureError("invalid user id");
      }
      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = refreshToken;

      return next();
    } catch (error) {
      throw error;
    }
  }

  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError("Not Have AT");

  try {
    const decodeUser = jwt.verify(accessToken, keyStore.publicKey);
    if (userId !== decodeUser.userId) {
      throw new AuthFailureError("Invalid UserId");
    }
    req.keyStore = keyStore;
    return next();
  } catch (error) {
    throw error;
  }
});

const verifyJWT = async (token, keySecret) => {
  return await jwt.verify(token, keySecret);
};

module.exports = {
  createTokenPair,
  authentication,
  verifyJWT,
  authenticationV2,
};
