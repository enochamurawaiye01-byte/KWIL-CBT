const generateRegistrationNumber = () => {
  const year = new Date().getFullYear();

  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `KWI-${year}-${randomNumber}`;
};

module.exports = generateRegistrationNumber;