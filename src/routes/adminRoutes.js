const router = require("express").Router();
const { authenticateToken } = require("../middlewares/AuthorizeAdmin");

const {
  getOneAdmin,
  getAllAdmins,
  getAdminsByType,
  LoginAdmin,
  RegisterAdmin,
  updateAdminById,
  sendPasswordResetLink,
  updateAdminPasswordByEmail,
  updateAdminPasswordByOldPassword,
  deleteAdminById,
} = require("../controllers/adminController");

router.get("/admins/find/:id", authenticateToken, getOneAdmin);
router.get("/admins/delete/:id", authenticateToken, deleteAdminById);
router.get("/admins", authenticateToken, getAllAdmins);
router.get("/admins/types/:typeName", authenticateToken, getAdminsByType);
router.post("/admins/register", RegisterAdmin);
router.post("/admins/login", LoginAdmin);
router.patch("/admins/edit/:id", authenticateToken, updateAdminById);
router.post("/admins/reset", sendPasswordResetLink);
router.patch("/admins/resetpassword/:email", updateAdminPasswordByOldPassword);
router.patch("/admins/reset", updateAdminPasswordByEmail);
router.delete("/admins/delete/:id", deleteAdminById);

module.exports = router;
