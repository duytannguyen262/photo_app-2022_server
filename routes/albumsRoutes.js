const express = require("express");
const albumsController = require("../controllers/albumsController");

const router = express.Router();

router.post("/create", albumsController.createAlbum);
router.get("/all/:userId", albumsController.getAlbumsByUserId);
router.get("/:albumId/photos", albumsController.getPhotosByAlbumId);
router.get("/:albumId", albumsController.getAlbumById);
router.get("/search/:searchKey", albumsController.getAlbumsBySearchKey);

module.exports = router;
