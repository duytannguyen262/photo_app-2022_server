const express = require("express");
const fileUpload = require("../middleware/file-upload");
const photosController = require("../controllers/photosController");

const router = express.Router();

router.get("/:id", photosController.getPhotoById);
router.get("/:id/info", photosController.getPhotoInfoById);
router.get("/deep/:id/:number/:name", photosController.getDeepZoomPhotoById);

router.post(
  "/upload",
  fileUpload.single("photo"),
  photosController.uploadPhoto
);

module.exports = router;
