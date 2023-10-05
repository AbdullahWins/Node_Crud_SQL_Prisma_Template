// controllers/adminController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SendEmail } = require("../services/email/SendEmail");
const { uploadFiles } = require("../utilities/uploadFile");
//prisma
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
//to generate resetToken
const crypto = require("crypto");

// login
const LoginAdmin = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email, password } = data;

    // Find the admin by email using Prisma
    const admin = await prisma.admin.findUnique({
      where: {
        email: email,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Compare the password using bcrypt
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Create a JWT token for authentication
    const expiresIn = "7d";
    const token = jwt.sign(
      { adminId: admin.email },
      process.env.JWT_TOKEN_SECRET_KEY,
      { expiresIn }
    );

    res.json({ token, admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// registration
const RegisterAdmin = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { name, email, password, permissions, status } = data;
    console.log(data);

    // Check if an admin with the same email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: {
        email: email,
      },
    });

    if (existingAdmin) {
      return res.status(409).json({ error: "Admin already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin using Prisma
    const newAdmin = await prisma.admin.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        permissions: permissions,
        status: status,
      },
    });

    console.log(newAdmin);
    res.status(201).json(newAdmin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get all Admin
const getAllAdmins = async (req, res) => {
  try {
    // Retrieve all admins using Prisma
    const admins = await prisma.admin.findMany();
    console.log(`Found ${admins.length} admins`);
    res.send(admins);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// get Admin by types
const getAdminsByType = async (req, res) => {
  try {
    const adminTypeName = req.params.typeName;

    // Retrieve admins by type using Prisma
    const admins = await prisma.admin.findMany({
      where: {
        type: adminTypeName,
      },
    });

    if (admins.length === 0) {
      res.status(404).send("No admins found for the specified type");
    } else {
      res.send(admins);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// get single Admin
const getOneAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id); // Parse id as an integer
    // Check if id is a valid integer
    if (isNaN(id)) {
      res.status(400).send("Invalid id parameter");
      return;
    }

    // Retrieve admin by id using Prisma
    const admin = await prisma.admin.findUnique({
      where: {
        id: id,
      },
    });

    if (!admin) {
      res.status(404).send("No admin found for the specified id");
    } else {
      res.send(admin);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// update one Admin
const updateAdminById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = JSON.parse(req?.body?.data);

    if (!data) {
      return res.status(400).send("Missing data in the request");
    }

    // Check if the admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: id },
    });

    if (!admin) {
      return res.status(404).send("No admin found for the specified id");
    }

    // Update the admin data
    const updateData = {};

    if (data.password) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    // Merge additional data into updateData
    Object.assign(updateData, data);

    // Perform the update using Prisma
    const updatedAdmin = await prisma.admin.update({
      where: { id: id },
      data: updateData,
    });

    res.send(updatedAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update admin");
  }
};

//tokenGeneration
function generateUniqueResetToken() {
  const token = crypto.randomBytes(16).toString("hex");
  return token;
}

// send password reset link to admin
const sendPasswordResetLink = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email } = data;

    if (!email) {
      return res.status(400).send("Email is required");
    }

    // Check if an admin with the provided email exists
    const admin = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (!admin) {
      return res.status(401).send("Admin doesn't exist");
    }

    // Generate a unique token for the password reset link
    const resetToken = generateUniqueResetToken();

    // Update the admin record in the database with the reset token
    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id }, // Use the admin's ID to identify the record
      data: { resetToken: resetToken }, // Update the resetToken field
    });

    // Send the password reset link via email
    const subject = "Reset Your Password";
    const resetLink = `${process.env.ADMIN_PASSWORD_RESET_URL}/${resetToken}`;
    const text = `Please follow this link to reset your password: ${resetLink}`;

    // You would need to implement the SendEmail function to send the email
    const status = await SendEmail(email, subject, text);

    res.status(200).send(status);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to reset admin password");
  }
};

// update one Admin password by email
const updateAdminPasswordByEmail = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email, newPassword } = data;

    if (!email || !newPassword) {
      return res.status(400).send("Email and newPassword are required");
    }

    // Check if an admin with the provided email exists
    const admin = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (!admin) {
      return res.status(401).send("Admin doesn't exist");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin's password in the database
    const updatedAdmin = await prisma.admin.update({
      where: { email: email }, // Use the email to identify the admin
      data: { password: hashedPassword }, // Update the password field
    });

    res.send(updatedAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to reset admin password");
  }
};

// update one admin password by OldPassword
const updateAdminPasswordByOldPassword = async (req, res) => {
  try {
    const email = req?.params?.email;
    console.log(email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const data = JSON.parse(req?.body?.data);
    const { oldPassword, newPassword } = data;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Old and new passwords are required" });
    }

    // Check if an admin with the provided email exists
    const admin = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Compare the provided old password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(oldPassword, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid old password" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin's password in the database
    const updatedAdmin = await prisma.admin.update({
      where: { email: email }, // Use the email to identify the admin
      data: { password: hashedPassword }, // Update the password field
    });

    res.send(updatedAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update admin password");
  }
};

// delete one Admin
const deleteAdminById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if id is a valid integer
    if (isNaN(id)) {
      return res.status(400).send("Invalid id parameter");
    }

    // Check if an admin with the provided id exists
    const admin = await prisma.admin.findUnique({
      where: { id: id },
    });

    if (!admin) {
      console.log("No admin found with this id:", id);
      return res.send("No admin found with this id!");
    }

    // Delete the admin record from the database
    const deletedAdmin = await prisma.admin.delete({
      where: { id: id },
    });

    console.log("Admin deleted:", deletedAdmin);
    res.send(deletedAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete admin");
  }
};

module.exports = {
  getOneAdmin,
  getAdminsByType,
  getAllAdmins,
  updateAdminById,
  sendPasswordResetLink,
  updateAdminPasswordByEmail,
  RegisterAdmin,
  LoginAdmin,
  updateAdminPasswordByOldPassword,
  deleteAdminById,
};
