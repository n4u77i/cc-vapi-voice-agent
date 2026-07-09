const { prisma } = require("../db/prisma");

async function listIntakes(req, res, next) {
  try {
    const intakes = await prisma.patientIntake.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 25,
      include: {
        call: true
      }
    });

    res.json({ data: intakes });
  } catch (error) {
    next(error);
  }
}

async function getIntakeById(req, res, next) {
  try {
    const intake = await prisma.patientIntake.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        call: true
      }
    });

    if (!intake) {
      return res.status(404).json({
        error: "Not Found",
        message: "Intake not found."
      });
    }

    return res.json({ data: intake });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listIntakes,
  getIntakeById
};
