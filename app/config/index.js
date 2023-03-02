const isProduction = process.env.NODE_ENV === "production",
  jwtSecretDev = process.env.JWT_SECRET_DEV,
  jwtSecretProd = process.env.JWT_SECRET_PROD,
  cookieSecretDev = process.env.COOKIE_SECRET_DEV,
  cookieSecretProd = process.env.COOKIE_SECRET_PROD,
  smtpEmailDev = process.env.SMTP_EMAIL_DEV,
  smtpPasswordDev = process.env.SMTP_PASSWORD_DEV,
  mongoDbUrlDev = process.env.MONGODB_URL_DEVELOPMENT,
  mongoDbUrlProd = process.env.MONGODB_URL_PRODUCTION;

// 259200000
// 302400000
const cookieSessionExpiration = 259200000, //3 days
  cookieJwtExpiration = 302400000; // 3 and half days

const baseFolder = isProduction ? "main/" : "dev/";
const mediaFolderName = `${baseFolder}product-media/`;
const variantFolderName = `${baseFolder}product-variant-media/`;
const shopImageFolderName = `${baseFolder}shop-image/`;
const avatarFolderName = `${baseFolder}avatar/`;

const originWhitelist = ["http://localhost:3000", "http://localhost:3001", "https://shopit-demo.com/"];

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
  smtpEmail: isProduction ? smtpEmailDev : smtpEmailDev,
  smtpPassword: isProduction ? smtpPasswordDev : smtpPasswordDev,
  baseVerificationUrl: `${
    isProduction ? "https://shopit-demo.com" : "http://localhost:3000"
  }/verify`,
  originWhitelist,
  mongodbUrl: isProduction ? mongoDbUrlProd : mongoDbUrlDev,
};
