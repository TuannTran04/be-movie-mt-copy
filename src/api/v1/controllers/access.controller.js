const { CREATED, SuccessResponse } = require("../core/success.response");
const AccessService = require("../services/access.service");

class AccessController {
  signUp = async (req, res, next) => {
    console.log("AccessController signUp:::", req.body);

    new CREATED({
      message: "Sign Up Created",
      metadata: await AccessService.signUp(req.body),
      options: {
        limit: 10,
        testdata: "extra info",
      },
    }).send(res);
  };

  login = async (req, res, next) => {
    new SuccessResponse({
      message: "login shop succeed, welcome you to shop ecommerce",
      metadata: await AccessService.login(req.body),
    }).send(res);
  };

  logout = async (req, res, next) => {
    new SuccessResponse({
      message: "Logout Success",
      metadata: await AccessService.logout(req.keyStore),
    }).send(res);
  };

  handleRefreshToken = async (req, res, next) => {
    new SuccessResponse({
      message: "get token succeed",
      metadata: await AccessService.handlerRefreshToken({
        refreshToken: req.refreshToken,
        user: req.user,
        keyStore: req.keyStore,
      }),
    }).send(res);
  };

  ///////////////////////////////////////////////////////////////////////////////////

  registerUser = async (req, res, next) => {
    console.log("AccessController registerUser:::", req.body);

    new CREATED({
      message: "Sign Up Init",
      statusCode: 200,
      metadata: await AccessService.registerUser(req.body),
    }).send(res);
  };

  registerVerifyUser = async (req, res, next) => {
    console.log("AccessController registerVerifyUser:::", req.body);

    new CREATED({
      message: "Sign Up Created",
      statusCode: 201,
      metadata: await AccessService.registerVerifyUser(req.body),
    }).send(res);
  };

  loginUser = async (req, res, next) => {
    const cookies = req.cookies;
    console.log("AccessController loginUser:::", req.body);

    new SuccessResponse({
      message: "Login Success",
      metadata: await AccessService.loginUser({
        cookies,
        ...req.body,
        res,
      }),
    }).send(res);
  };

  requestRefreshToken = async (req, res, next) => {
    // const cookies = req.cookies;
    const cookies = req.cookies.refreshTokenJWT || req.headers.refreshtokenjwt;
    console.log("requestRefreshToken", cookies);

    new SuccessResponse({
      message: "Refresh Token Success",
      metadata: await AccessService.requestRefreshToken({
        cookies,
        res,
        user: req.user,
        keyStore: req.keyStore,
      }),
    }).send(res);
  };

  logOut = async (req, res) => {
    const cookies = req.cookies.refreshTokenJWT || req.headers.refreshtokenjwt;
    console.log(cookies);
    new SuccessResponse({
      message: "Logout Success",
      metadata: await AccessService.logOut({
        cookies,
        res,
        keyStore: req.keyStore,
      }),
    }).send(res);
  };

  forgotPwdUser = async (req, res) => {
    console.log(">>> forgotPwdUser :<<<", req.body);

    new SuccessResponse({
      message: "Forget Password Init",
      metadata: await AccessService.forgotPwdUser(req.body),
    }).send(res);
  };

  forgotPwdUserVerifyOTP = async (req, res) => {
    console.log(">>> forgotPwdUserVerifyOTP :<<<", req.body);

    new SuccessResponse({
      message: "Forget Password Success",
      metadata: await AccessService.forgotPwdUserVerifyOTP(req.body),
    }).send(res);
  };
}

module.exports = new AccessController();
