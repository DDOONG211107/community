const result = (data, message = "success") => {
  if (data) {
    return {
      message,
      data,
    };
  }
  return { message };
};

module.exports = result;
