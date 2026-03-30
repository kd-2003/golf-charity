const router = require("express").Router();
const { createCheckoutSession, createPortalSession } = require("../controllers/billingController");
const { requireAuth } = require("../middleware/auth");

router.post("/checkout-session", requireAuth, createCheckoutSession);
router.post("/portal-session", requireAuth, createPortalSession);

module.exports = router;
