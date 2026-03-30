const router = require("express").Router();
const {
  listDraws,
  listUpcomingInfo,
  simulateDraw,
  saveDraft,
  publishMonthlyDraw,
} = require("../controllers/drawController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/", listDraws);
router.get("/upcoming", listUpcomingInfo);
router.post("/simulate", requireAuth, requireAdmin, simulateDraw);
router.post("/draft", requireAuth, requireAdmin, saveDraft);
router.post("/publish", requireAuth, requireAdmin, publishMonthlyDraw);

module.exports = router;
