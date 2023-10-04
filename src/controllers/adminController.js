// controllers/adminController.js

const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { adminsCollection } = require("../../config/database/db");
const AdminModel = require("../models/AdminModel");
const { SendEmail } = require("../services/email/SendEmail");
const { uploadFiles } = require("../utilities/uploadFile");
//prisma
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    const adminId = req.params.id;
    const admin = await adminsCollection.findOne({
      _id: new ObjectId(adminId),
    });
    if (!admin) {
      res.status(404).send("admin not found");
    } else {
      res.send(admin);
      console.log(admin);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


// update one Admin
const updateAdminById = async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const { files } = req;
    const data = JSON.parse(req?.body?.data);
    const { password, ...additionalData } = data;
    const folderName = "admins";
    let updateData = {};

    if (files) {
      const fileUrls = await uploadFiles(files, folderName);
      const fileUrl = fileUrls[0];
      updateData = { ...updateData, fileUrl };
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData = { ...updateData, password: hashedPassword };
    }
    if (additionalData) {
      updateData = { ...updateData, ...additionalData };
    }
    const result = await adminsCollection.updateOne(query, {
      $set: updateData,
    });
    console.log(result);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update admin");
  }
};

// send password reset link to admin
const sendPasswordResetLink = async (req, res) => {
  try {
    const data = JSON.parse(req?.body?.data);
    const { email } = data;
    if (email) {
      const query = { email: email };
      const result = await adminsCollection.findOne(query);
      const receiver = result?.email;
      console.log(receiver);
      if (!receiver) {
        res.status(401).send("admin doesn't exists");
      } else {
        const subject = "Reset Your Password";
        const text = `Please follow this link to reset your password: ${process.env.ADMIN_PASSWORD_RESET_URL}/${receiver}`;
        const status = await SendEmail(receiver, subject, text);
        res.status(200).send(status);
      }
    }
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
    let updateData = {};
    if (email && newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData = { password: hashedPassword };
    }
    const query = { email: email };
    const result = await adminsCollection.updateOne(query, {
      $set: updateData,
    });
    res.send(result);
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
    const query = { email: email };
    const data = JSON.parse(req?.body?.data);
    const admin = await AdminModel.findByEmail(email);

    const { oldPassword, newPassword } = data;
    let updateData = {};

    if (!admin) {
      return res.status(404).json({ error: "admin not found" });
    }
    const passwordMatch = await bcrypt.compare(oldPassword, admin?.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "invalid password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    updateData = { password: hashedPassword };
    const result = await adminsCollection.updateOne(query, {
      $set: updateData,
    });
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update admin password");
  }
};

// delete one Admin
const deleteAdminById = async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await adminsCollection.deleteOne(query);
    if (result?.deletedCount === 0) {
      console.log("no admin found with this id:", id);
      res.send("no admin found with this id!");
    } else {
      console.log("admin deleted:", id);
      res.send(result);
    }
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
