const { prisma } = require("../db/prisma");

async function countCalls() {
  return prisma.call.count();
}

module.exports = { countCalls };
