class ApiError extends Error {
  constructor(c, m) {
    super(m);
    this.statusCode = c;
  }
}
module.exports = ApiError;
