const router = require("express").Router();
const { authenticateToken } = require("../middlewares/AuthorizeAdmin");

const {
  getOneAdmin,
  getAllAdmins,
  getAdminsByType,
  addOneAdmin,
  LoginAdmin,
  RegisterAdmin,
  updateAdminById,
  sendPasswordResetLink,
  updateAdminPasswordByEmail,
  updateAdminPasswordByOldPassword,
  deleteAdminById,
} = require("../controllers/adminController");

router.get("/admin/find/:id", authenticateToken, getOneAdmin);
router.get("/admin/delete/:id", authenticateToken, deleteAdminById);
router.get("/admin", authenticateToken, getAllAdmins);
router.get("/admin/types/:typeName", authenticateToken, getAdminsByType);
router.post("/admin/add", authenticateToken, addOneAdmin);
router.post("/admin/register", RegisterAdmin);
router.post("/admin/login", LoginAdmin);
router.patch("/admin/edit/:id", authenticateToken, updateAdminById);
router.post("/admin/reset", sendPasswordResetLink);
router.patch("/admin/resetpassword/:email", updateAdminPasswordByOldPassword);
router.patch("/admin/reset", updateAdminPasswordByEmail);
router.delete("/admin/delete/:id", deleteAdminById);

module.exports = router;
