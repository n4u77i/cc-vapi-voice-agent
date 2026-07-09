const { prisma } = require("../db/prisma");

async function listCalls(req, res, next) {
  try {
    const calls = await prisma.call.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 25,
      include: {
        intakes: true
      }
    });

    res.json({ data: calls });
  } catch (error) {
    next(error);
  }
}

async function getCallById(req, res, next) {
  try {
    const call = await prisma.call.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        intakes: true,
        events: {
          orderBy: {
            createdAt: "desc"
          },
          take: 20
        }
      }
    });

    if (!call) {
      return res.status(404).json({
        error: "Not Found",
        message: "Call not found."
      });
    }

    return res.json({ data: call });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCalls,
  getCallById
};
