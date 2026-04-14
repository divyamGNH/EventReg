import express from "express";
import {
  register,
  login,
  logout,
  checkAuth,
  ensureTestAdmin,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/test-admin/ensure", ensureTestAdmin);
router.get("/check", authMiddleware, checkAuth);

export default router;
