function maskPhone(phone) {
  if (!phone) return null;

  const value = String(phone);

  if (value.length <= 4) return "****";

  return `${value.slice(0, 3)}****${value.slice(-2)}`;
}

module.exports = { maskPhone };
