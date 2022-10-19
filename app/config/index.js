const isProduction = process.env.NODE_ENV === "production",
  jwtSecretDev = process.env.JWT_SECRET_DEV,
  jwtSecretProd = process.env.JWT_SECRET_PROD,
  cookieSecretDev = process.env.COOKIE_SECRET_DEV,
  cookieSecretProd = process.env.COOKIE_SECRET_PROD;

const cookieSessionExpiration = 259200000, //3 days
  cookieJwtExpiration = 302400000; // 3 and half days

module.exports = {
  cookieSessionExpiration,
  cookieJwtExpiration,
  audience: isProduction ? "production-host" : "localhost",
  jwtSecretKey: isProduction ? jwtSecretProd : jwtSecretDev,
  cookieSecretKey: isProduction ? cookieSecretProd : cookieSecretDev,
  isProduction,
};
