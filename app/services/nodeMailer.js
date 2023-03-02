var nodemailer = require("nodemailer");
const { smtpEmail, smtpPassword } = require("../config");
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
};

const getTransporter = () => {
  return transporter;
};

module.exports = {
  initTransporter,
  getTransporter,
};
