require("dotenv").config();

const bcrypt = require("bcryptjs");

const prisma = require("../src/config/database");

const createAdmin = async () => {
  try {
    const email = "tech2grassroots@gmail.com";
    const password = "Tech2School2026";

    const existingAdmin = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("Admin created successfully.");
    console.log("Email:", admin.email);
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();