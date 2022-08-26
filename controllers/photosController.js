const sharp = require("sharp");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

const getSharedPhotos = async (req, res, next) => {
  const { userId } = req.params;
  const photos = await Photo.find({ sharedTo: { $in: userId } });
  if (photos.length > 0) {
    res.status(200).send({ photos });
  }
};

const uploadPhoto = async (req, res) => {
  const { body, file } = req;
  const { ofAlbum, ofAlbums } = body;
  const ofAlbumsToSave = [];
  const ofAlbumsArray = ofAlbums.split(",");

  const foundAlbum = await Album.findById(ofAlbum);
  if (!foundAlbum && ofAlbumsArray.length === 0) {
    return res.status(404).json({ message: "Album not found" });
  }

  //Save to mongoDB
  if (ofAlbumsArray.length > 0 && ofAlbums !== "") {
    ofAlbumsToSave.push(...ofAlbumsArray);
  }

  if (foundAlbum) {
    ofAlbumsToSave.push(ofAlbum);
  }
  const newPhoto = new Photo({
    name: body.name,
    author: {
      id: body.authorId,
      name: body.authorName,
    },
    resolution: body.resolution,
    ofAlbums: [...new Set(ofAlbumsToSave)],
    createdAt: new Date().toISOString(),
  });

  //shred the image to tiles and save to zip file
  fs.access("uploads/photos", (err) => {
    if (err) {
      fs.mkdirSync("./uploads/photos", (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });

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

const uploadPhotos = async (req, res, next) => {
  try {
    const { files, body } = req;
    const { ofAlbum, ofAlbums } = body;
    const ofAlbumsToSave = [];
    const ofAlbumsArray = ofAlbums.split(",");

    const foundAlbum = await Album.findById(ofAlbum);
    if (!foundAlbum && ofAlbumsArray.length === 0) {
      return res.status(404).json({ message: "Album not found" });
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoInfo = JSON.parse(body.photosInfos[i]);

      //Save to mongoDB
      if (ofAlbumsArray.length > 0 && ofAlbums !== "") {
        ofAlbumsToSave.push(...ofAlbumsArray);
      }

      if (foundAlbum) {
        ofAlbumsToSave.push(ofAlbum);
      }

      const newPhoto = new Photo({
        name: photoInfo.newName,
        author: {
          id: photoInfo.authorId,
          name: photoInfo.authorName,
        },
        resolution: photoInfo.resolution,
        ofAlbums: [...new Set(ofAlbumsToSave)],
        createdAt: new Date().toISOString(),
      });

      //shred the image to tiles and save to zip file
      fs.access("uploads/photos", (err) => {
        if (err) {
          fs.mkdirSync("./uploads/photos", (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      });

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

        const [photoWidth, photoHeight] = photoInfo.resolution.split("x");

        await sharp(file.buffer)
          .png()
          .resize(Math.floor(photoWidth / 6), Math.floor(photoHeight / 6))
          .toFile(`${path_toSave}/${fileName_toSave}/${fileName_toSave}.png`);

        await newPhoto.save();
      } catch (error) {
        console.log("[Error while sharping]", error);
      }
    }

    res.status(201).send({ message: "File Uploaded" });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const sharePhoto = async (req, res, next) => {
  const { id } = req.params;
  const { userIds } = req.body;
  try {
    //update sharedTo field in the photo
    await Photo.findByIdAndUpdate(id, {
      sharedTo: userIds,
    });

    res.status(200).json({ message: "Shared successfully" });
  } catch (error) {
    console.log("[ERROR WHILE SAVING TO MONGODB", error);
  }
};

const generateTempLink = async (req, res) => {
  const { photoId } = req.params;

  const photo = await Photo.findById(photoId);

  const token = jwt.sign({ photo }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).send({ token });
};

const deletePhotoById = async (req, res) => {
  const { id } = req.params;
  const foundPhoto = await Photo.findById(id);

  if (!foundPhoto) {
    return res.status(404).json({ message: "Photo not found" });
  }
  const path = `uploads/photos/${id}`;
  fs.rmSync(path, { recursive: true });

  await Photo.findByIdAndDelete(id);
  res.status(200).json({ message: "Photo deleted" });
};

const updatePhoto = async (req, res) => {
  const { id } = req.params;
  const { name, resolution } = req.body;
  const { file } = req;

  const foundPhoto = await Photo.findById(id);
  if (!foundPhoto) {
    return res.status(404).json({ message: "Photo not found" });
  }
  const fileName_toSave = `${id}`;
  const path_toSave = "./uploads/photos";
  try {
    //Remove existing file
    fs.rmSync(`${path_toSave}/${fileName_toSave}`, { recursive: true });

    //tile new file
    await sharp(file.buffer)
      .tile({ size: 256 })
      .toFile(`${path_toSave}/${fileName_toSave}.zip`);

    //Save to zip file -> unzipped -> delete zip file
    await fs
      .createReadStream(`${path_toSave}/${fileName_toSave}.zip`)
      .pipe(unzipper.Extract({ path: `${path_toSave}` }))
      .promise()
      .then(() => {
        fs.promises.unlink(`${path_toSave}/${fileName_toSave}.zip`);
      });

    const [photoWidth, photoHeight] = resolution.split("x");

    //Save the mini size png to the file
    await sharp(file.buffer)
      .png()
      .resize(Math.floor(photoWidth / 6), Math.floor(photoHeight / 6))
      .toFile(`${path_toSave}/${fileName_toSave}/${fileName_toSave}.png`);

    //Update to mongodb
    const updatedPhoto = {
      name,
      resolution,
      createdAt: new Date().toISOString(),
    };
    await Photo.findByIdAndUpdate(id, updatedPhoto);
  } catch (error) {
    console.log("[Error while sharping]", error);
  }
  res.status(200).json({ message: "Photo updated" });
};

module.exports = {
  getPhotoById,
  getPhotoInfoById,
  getDeepZoomPhotoById,
  getSharedPhotos,
  uploadPhoto,
  uploadPhotos,
  sharePhoto,
  generateTempLink,
  deletePhotoById,
  updatePhoto,
};
