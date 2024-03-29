const _ = require("lodash");

const getInfoData = ({ fields = [], object = {} }) => {
  // console.log("fields::", fields);
  // console.log("object::", object);

  return _.pick(object, fields);
};

module.exports = {
  getInfoData,
};
