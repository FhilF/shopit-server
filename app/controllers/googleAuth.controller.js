const config = require("../config");
exports.googleCallback = (req, res) => {
  // const token = req.user.generateJWT();

  // res.cookie("jwt", token, {
  //   httpOnly: true,
  //   expires: new Date(Date.now() + config.cookieJwtExpiration),
  // });
  try {
    const { state } = req.query;
    const { returnTo } = JSON.parse(Buffer.from(state, "base64").toString());
    if (typeof returnTo === "string") {
      return res.redirect(returnTo);
    }
  } catch {
    // just redirect normally below
  }
  res.redirect("/");
};
