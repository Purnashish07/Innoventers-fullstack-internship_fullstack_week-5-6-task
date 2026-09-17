const e = require("express");
const r = e.Router();
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  createPaymentOrder,
  createDemoPaymentOrder,
  verifyPayment,
  verifyDemoPayment,
} = require("../controllers/project.controller");
const { protect } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");
r.use(protect);
r.route("/").get(getProjects).post(upload.single("image"), createProject);
r.route("/:id").put(upload.single("image"), updateProject).delete(deleteProject);
r.post("/payment/order", createPaymentOrder);
r.post("/payment/demo/order", createDemoPaymentOrder);
r.post("/payment/verify", verifyPayment);
r.post("/payment/demo/verify", verifyDemoPayment);
module.exports = r;
