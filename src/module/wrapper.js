module.exports = (requestHnadler) => {
  return async (req, res, next) => {
    try {
      await requestHnadler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};
