const config = require("../config")
exports.googleCallback = (req, res) => {
  const token = req.user.generateJWT();
  res.cookie("jwt", token, {
    // maxAge: 900000,
    httpOnly: true,
    expires: new Date(Date.now() + config.cookieJwtExpiration),
  });
  res.redirect("/profile");
};
