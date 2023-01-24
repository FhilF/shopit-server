const validator = require("validator");

exports.getFileExt = function (filename) {
  return /[.]/.exec(filename) ? /[^.]+$/.exec(filename) : undefined;
};

exports.removeEmpty = function (obj) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
};

exports.stringValidator = function (str) {
  if (str) {
    validator.isEmpty(str);
  }
  return null;
};
