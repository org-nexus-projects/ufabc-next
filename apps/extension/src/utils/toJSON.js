import _ from 'lodash';

const toJSON = (payload, max) => {
  const json = JSON.parse(
    _.get(new RegExp(/^\w*=(.*)/).exec(payload), '[1]', {}),
  );

  if (max) {
    return json.slice(0, max);
  }

  return json;
};

module.exports = {
  toJSON,
};
