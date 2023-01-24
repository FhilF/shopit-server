const isProduction = process.env.NODE_ENV === "production",
  jwtSecretDev = process.env.JWT_SECRET_DEV,
  jwtSecretProd = process.env.JWT_SECRET_PROD,
  cookieSecretDev = process.env.COOKIE_SECRET_DEV,
  cookieSecretProd = process.env.COOKIE_SECRET_PROD;

  // 259200000
  // 302400000
const cookieSessionExpiration = 259200000, //3 days
  cookieJwtExpiration = 302400000; // 3 and half days

const baseFolder = isProduction ? "yeti-users/" : "yeti-users-dev/";
const mediaFolderName = `${baseFolder}product-media/`;
const variantFolderName = `${baseFolder}product-variant-images/`;
const shopImageFolderName = `${baseFolder}shop-images/`;
const avatarFolderName = `${baseFolder}avatar/`;

module.exports = {
  mediaFolderName,
  variantFolderName,
  shopImageFolderName,
  avatarFolderName,
  cookieSessionExpiration,
  cookieJwtExpiration,
  audience: isProduction ? "production-host" : "localhost",
  jwtSecretKey: isProduction ? jwtSecretProd : jwtSecretDev,
  cookieSecretKey: isProduction ? cookieSecretProd : cookieSecretDev,
  isProduction,
};
