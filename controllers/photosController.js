const sharp = require("sharp");
const mongoose = require("mongoose");
const fs = require("fs");
const Photo = require("../models/photo");
const Album = require("../models/album");
const User = require("../models/user");
const unzipper = require("unzipper");

const getPhotoById = async (req, res, next) => {
  const { id } = req.params;
  res.sendFile(`${id}/${id}.png`, {
    root: "./uploads/photos",
  });
};

const getPhotoInfoById = async (req, res, next) => {
  const { id } = req.params;
  const foundPhoto = await Photo.findById(id)
    .populate({
      path: "ofAlbums",
      model: Album,
    })
    .populate({
      path: "author",
      model: User,
    });
  res.send({ data: foundPhoto });
};

const getDeepZoomPhotoById = async (req, res) => {
  const { id, number, name } = req.params;
  const fileName = `${number}/${name}`;
  const path = `uploads/photos/${id}/${id}_files/`;
  res.sendFile(fileName, { root: path });
};

const uploadPhoto = async (req, res) => {
  const { body, file } = req;
  console.log(
    "😎 ~ file: photosController.js ~ line 39 ~ uploadPhoto ~ body",
    body
  );
  const { ofAlbum, ofAlbums } = body;
  console.log(
    "🚀 ~ file: photosController.js ~ line 40 ~ uploadPhoto ~ { ofAlbum, ofAlbums }",
    { ofAlbum, ofAlbums }
  );
  return;
  fs.access("uploads/photos", (err) => {
    if (err) {
      fs.mkdirSync("./uploads/photos", (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });

  //Save to mongoDB
  const foundAlbum = await Album.findById(ofAlbum);
  if (!foundAlbum) {
    return res.status(404).json({ message: "Album not found" });
  }

  const newPhoto = new Photo({
    name: body.name,
    author: {
      id: body.authorId,
      name: body.authorName,
    },
    resolution: body.resolution,
    ofAlbums: [ofAlbum, ...ofAlbums],
    createdAt: new Date().toISOString(),
  });

  //shred the image to tiles and save to zip file
  const fileName_toSave = `${newPhoto._id.toString()}`;
  const path_toSave = "./uploads/photos";

  try {
    await sharp(file.buffer)
      .tile({ size: 256 })
      .toFile(`${path_toSave}/${fileName_toSave}.zip`);

    await fs
      .createReadStream(`${path_toSave}/${fileName_toSave}.zip`)
      .pipe(unzipper.Extract({ path: `${path_toSave}` }))
      .promise()
      .then(() => {
        fs.promises.unlink(`${path_toSave}/${fileName_toSave}.zip`);
      });

    const [photoWidth, photoHeight] = body.resolution.split("x");

    await sharp(file.buffer)
      .png()
      .resize(Math.floor(photoWidth / 6), Math.floor(photoHeight / 6))
      .toFile(`${path_toSave}/${fileName_toSave}/${fileName_toSave}.png`);

    await newPhoto.save();
  } catch (error) {
    console.log("[Error while sharping]", error);
  }

  res.status(200).send({ message: "Uploaded", progress: "100%" });
};

module.exports = {
  getPhotoById,
  getPhotoInfoById,
  getDeepZoomPhotoById,
  uploadPhoto,
};
