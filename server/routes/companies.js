const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { authenticate, authorize } = require("../middleware/auth");

// Company Admin routes
router.get("/my", authenticate, authorize("Company Admin"), companyController.getMyCompany);
router.post("/vehicles", authenticate, authorize("Company Admin"), companyController.addCompanyVehicle);
router.post("/topup", authenticate, authorize("Company Admin"), companyController.topUpCompanyWallet);
router.post("/simulate-topup", authenticate, authorize("Company Admin"), companyController.simulateCompanyTopup);
router.get("/topup/:checkoutRequestId", authenticate, authorize("Company Admin"), companyController.getTopupStatus);

// System Admin routes
router.get("/", authenticate, authorize("Admin"), companyController.getAllCompanies);
router.post("/", authenticate, authorize("Admin"), companyController.createCompany);
router.put("/:id/status", authenticate, authorize("Admin"), companyController.updateCompanyStatus);

module.exports = router;