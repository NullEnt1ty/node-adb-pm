class AdbError extends Error {

  constructor(message) {
    super(message);
    this.name = 'AdbError';
  }

}

module.exports = AdbError;
