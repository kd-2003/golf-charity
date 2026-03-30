const router = require("express").Router();
const {
  me,
  updateProfile,
  addScore,
  updateScore,
  donation,
  myWinnings,
  participationSummary,
  uploadWinnerProof,
} = require("../controllers/userController");
const { requireAuth, requireActiveSubscription } = require("../middleware/auth");

router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);
router.get("/me/participation", requireAuth, participationSummary);
router.get("/me/winnings", requireAuth, myWinnings);
router.post("/scores", requireAuth, requireActiveSubscription, addScore);
router.put("/scores/:index", requireAuth, requireActiveSubscription, updateScore);
router.post("/donation", requireAuth, donation);
router.post("/winner-proof", requireAuth, uploadWinnerProof);

module.exports = router;
