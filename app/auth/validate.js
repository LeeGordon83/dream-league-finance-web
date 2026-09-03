const validate = (decoded, _request, _h) => {
  return {
    isValid: true,
    credentials: decoded
  }
}

module.exports = validate
