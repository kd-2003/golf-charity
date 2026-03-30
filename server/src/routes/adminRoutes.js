const router = require("express").Router();
const {
  dashboard,
  listUsers,
  updateUser,
  adminSetUserScores,
  updateUserSubscription,
  listDrawsAdmin,
  markWinnerPayment,
  listWinnerProofs,
  reviewWinnerProof,
} = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.use(requireAuth, requireAdmin);
router.get("/dashboard", dashboard);
router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.put("/users/:id/scores", adminSetUserScores);
router.patch("/users/:id/subscription", updateUserSubscription);
router.get("/draws", listDrawsAdmin);
router.patch("/draws/:drawId/winners/payment", markWinnerPayment);
router.get("/winner-proofs", listWinnerProofs);
router.put("/winner-proofs/:id", reviewWinnerProof);

module.exports = router;
