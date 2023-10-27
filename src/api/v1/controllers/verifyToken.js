const jwt = require("jsonwebtoken");

const verifyToken1 = (req, res, next) => {
  //ACCESS TOKEN FROM HEADER, REFRESH TOKEN FROM COOKIE
  const token = req.headers.token;
  console.log(">>> verifyToken: <<<", token);
  // const refreshToken = req.cookies.refreshToken;
  // console.log(">>> refreshToken: <<<", refreshToken);

  console.log(">>> authHeader cookie: <<<", JSON.stringify(req.cookies));

  if (token) {
    const accessToken = token.split(" ")[1];
    jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err) {
        console.log(">>> err verifyToken <<<", err);
        return res.status(403).json("Token is not valid!");
      }
      console.log(user);
      req.user = user;
      next();
    });
  } else {
    console.log("You're not authenticated.......");

    return res.status(401).json("You're not authenticated");
  }
};

const verifyToken = (req, res, next) => {
  const authHeader =
    req.headers.authorization || req.headers.Authorization || req.headers.token;
  console.log(">>> authHeader VerifyJWT: <<<", authHeader);
  console.log(">>> cookie VerifyJWT: <<<", JSON.stringify(req.cookies));

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("No auth header start with Bearer");
    return res.sendStatus(401);
  }
  const accessToken = authHeader.split(" ")[1];
  // console.log(">>> token VerifyJWT: <<<", token);
  jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
    if (err) {
      console.log(">>> err verifyToken <<<", err);
      return res.status(403).json("Token is not valid!");
    }
    console.log(">>> user VerifyJWT: <<<", user);
    req.user = user;
    next();
  });
};

const verifyTokenAndUserAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("You're not allowed to do that!");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("You're not allowed to do that!");
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndUserAuthorization,
  verifyTokenAndAdmin,
};
