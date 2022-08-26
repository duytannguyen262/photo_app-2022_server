const Album = require("../models/album");
const Photo = require("../models/photo");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const createAlbum = async (req, res) => {
  const { body } = req;
  const newAlbum = new Album({
    name: body.name,
    author: body.author,
    createdAt: new Date().toISOString(),
  });
  await newAlbum.save();
  res.status(200).json({ newAlbum });
};

const shareAlbum = async (req, res, next) => {
  const { id } = req.params;
  const { userIds } = req.body;
  try {
    //update sharedTo field in the album
    const updatedAlbum = await Album.findByIdAndUpdate(id, {
      sharedTo: userIds,
    });
    const photosToUpdate = await Photo.updateMany(
      { ofAlbums: { $in: id } },
      {
        sharedTo: userIds,
      }
    ).then((result, err) => {
      if (err) {
        next(err);
      }
      res.status(200).json({ message: "Shared successfully" });
    });
  } catch (error) {
    console.log("[ERROR WHILE SAVING TO MONGODB", error);
  }
};

const generateTempLink = async (req, res) => {
  const { albumId } = req.params;

  const album = await Album.findById(albumId);

  const token = jwt.sign({ album }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).send({ token });
};

const deleteAlbumById = async (req, res) => {
  const { id } = req.params;
  const photosOfAlbum = await Photo.find({ ofAlbums: { $in: id } });

  if (photosOfAlbum.length > 0) {
    const photosToDelete = photosOfAlbum.map((photo) => photo._id);
    photosToDelete.map((id) => {
      const path = `uploads/photos/${id}`;
      fs.rmSync(path, { recursive: true });
    });
    await Photo.deleteMany({ _id: { $in: photosToDelete } });
  }

  await Album.findByIdAndDelete(id);

  res.status(200).json({ message: "Delete album successfully" });
};

const getAlbumsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const foundAlbums = await Album.find({ "author.id": userId });
  res.status(200).json({ data: foundAlbums });
};

const getAlbumsBySearchKey = async (req, res) => {
  const { searchKey } = req.params;
  const albums = await Album.find({ name: { $regex: searchKey } });
  if (!albums) {
    res.status(404).json({ message: "No albums found" });
  }
  res.status(200).json({ albums });
};

const getAlbumsSharedToUser = async (req, res) => {
  const { userId } = req.params;
  const albums = await Album.find({ sharedTo: { $in: userId } });
  if (albums.length > 0) {
    res.status(200).send({ albums });
  }
};

const getPhotosByAlbumId = async (req, res) => {
  const { albumId } = req.params;
  const photos = await Photo.find({ ofAlbums: albumId });

  res.status(200).json({ photos });
};

const getAlbumById = async (req, res) => {
  const { albumId } = req.params;
  const album = await Album.findById(albumId);

  res.status(200).json({ album });
};

module.exports = {
  createAlbum,
  shareAlbum,
  generateTempLink,
  deleteAlbumById,
  getAlbumsBySearchKey,
  getAlbumsByUserId,
  getAlbumsSharedToUser,
  getAlbumById,
  getPhotosByAlbumId,
};
