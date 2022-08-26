const express = require("express");
const fileUpload = require("../middleware/file-upload");
const photosController = require("../controllers/photosController");

const router = express.Router();

router.get("/:id", photosController.getPhotoById);
router.get("/:id/info", photosController.getPhotoInfoById);
router.get("/deep/:id/:number/:name", photosController.getDeepZoomPhotoById);
router.get("/shared/:userId", photosController.getSharedPhotos);
router.get("/:photoId/createLink", photosController.generateTempLink);

router.post(
  "/upload",
  fileUpload.single("photo"),
  photosController.uploadPhoto
);
router.post(
  "/uploadMultiple",
  fileUpload.array("photos"),
  photosController.uploadPhotos
);

router.post("/:id/share", photosController.sharePhoto);
router.put("/:id", fileUpload.single("file"), photosController.updatePhoto);

router.delete("/:id", photosController.deletePhotoById);

module.exports = router;
