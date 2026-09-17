const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

const getProjectListKey = (userId, query = {}) => {
  const normalized = Object.keys(query)
    .sort()
    .reduce((acc, key) => {
      acc[key] = query[key];
      return acc;
    }, {});

  return `projects_${userId}_${JSON.stringify(normalized)}`;
};

const invalidateProjectListCache = (userId) => {
  cache
    .keys()
    .filter((key) => key.startsWith(`projects_${userId}_`))
    .forEach((key) => cache.del(key));
};

module.exports = cache;
module.exports.cache = cache;
module.exports.getProjectListKey = getProjectListKey;
module.exports.invalidateProjectListCache = invalidateProjectListCache;
