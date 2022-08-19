const Album = require("../models/album");
const Photo = require("../models/photo");

const createAlbum = async (req, res) => {
  const { body } = req;
  const newAlbum = new Album({
    name: body.name,
    author: body.author,
  });
  await newAlbum.save();
  res.status(200).json({ newAlbum });
};

const getAlbumsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const foundAlbums = await Album.find({ "author.id": userId });
  res.status(200).json({ data: foundAlbums });
};

const getAlbumsBySearchKey = async (req, res) => {
  const { searchKey } = req.params;
  const albums = await Album.find({ name: { $regex: searchKey } });
  res.status(200).json({ albums });
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
  getAlbumsBySearchKey,
  getAlbumsByUserId,
  getAlbumById,
  getPhotosByAlbumId,
};
