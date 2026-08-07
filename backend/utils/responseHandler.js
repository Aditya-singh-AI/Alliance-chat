const response = (res, statusCode, message, data = null) => {
  if (!res) {
    console.error("Response objects is null");
    return;
  }
  const responseObject = {
    status: statusCode < 400 ? "success" : "failure",
    statusCode,
    message,
    data,
  };
  return res.status(statusCode).json(responseObject);
};
module.exports = response;
