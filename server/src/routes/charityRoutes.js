const router = require("express").Router();
const {
  listCharities,
  getCharity,
  createCharity,
  updateCharity,
  deleteCharity,
} = require("../controllers/charityController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/", listCharities);
router.get("/:id", getCharity);
router.post("/", requireAuth, requireAdmin, createCharity);
router.put("/:id", requireAuth, requireAdmin, updateCharity);
router.delete("/:id", requireAuth, requireAdmin, deleteCharity);

module.exports = router;
