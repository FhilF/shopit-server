const regionJson = require("./ph-addresses/short-region"),
  provinceJson = require("./ph-addresses/province"),
  cityJson = require("./ph-addresses/city"),
  barangayJson = require("./ph-addresses/barangay");

const placeObj = {
  region: { id: "id", label: "name", json: regionJson },
  province: {
    id: "province_code",
    label: "province_name",
    json: provinceJson,
  },
  city: {
    id: "city_code",
    label: "city_name",
    json: cityJson,
  },
  barangay: {
    id: "brgy_code",
    label: "brgy_name",
    json: barangayJson,
  },
};
const getAddressValue = (data, type, valueKey, returnKey) => {
  if (!data) return "";

  const filtered = placeObj[type].json.filter(
    (v) => v[placeObj[type][valueKey]] === data
  );
  if (filtered.length === 0) return "";
  return filtered[0][placeObj[type][returnKey]];
  // return filtered[0].value;
};
module.exports = { getAddressValue };
