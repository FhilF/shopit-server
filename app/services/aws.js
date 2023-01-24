const S3 = require("aws-sdk/clients/s3");

const { isProduction } = require("../config");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

async function uploadFile(data) {
  return new Promise(async function (resolve, reject) {
    const params = {
      Bucket: bucketName,
      ...data,
    };

    s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err);
      }
      console.log(`File uploaded successfully at ${data.Location}`);
      resolve(data.Location);
    });
  });
}

module.exports = {
  s3,
  uploadFile,
};
