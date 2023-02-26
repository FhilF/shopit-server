var nodemailer = require("nodemailer");
const { smtpEmail, smtpPassword } = require("../config");

// var smtpTransport = nodemailer.createTransport(
//   "smtps://yeti.shop09%40gmail.com:" +
//     encodeURIComponent("abpvxtjjtkbjaqfc") +
//     "@smtp.gmail.com:465"
// );

// smtpTransport.verify(function (error, success) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Server is ready to take our messages");
//   }
// });

let transporter;
const initTransporter = () => {
  transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  // transporter.verify(function (error, success) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log("Server is ready to take our messages");
  //   }
  // });
};

const getTransporter = () => {
  return transporter;
};

module.exports = {
  initTransporter,
  getTransporter,
};
