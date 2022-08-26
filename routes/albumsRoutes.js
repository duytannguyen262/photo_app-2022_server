const express = require("express");
const albumsController = require("../controllers/albumsController");

const router = express.Router();

router.post("/create", albumsController.createAlbum);
router.post("/:id/share", albumsController.shareAlbum);
router.delete("/:id", albumsController.deleteAlbumById);

router.get("/all/:userId", albumsController.getAlbumsByUserId);
router.get("/shared/:userId", albumsController.getAlbumsSharedToUser);
router.get("/:albumId/photos", albumsController.getPhotosByAlbumId);
router.get("/:albumId", albumsController.getAlbumById);
router.get("/:albumId/createLink", albumsController.generateTempLink);
router.get("/search/:searchKey", albumsController.getAlbumsBySearchKey);

module.exports = router;
