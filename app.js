const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const HttpError = require("./models/httpError");
const usersRoutes = require("./routes/usersRoutes");
const albumsRoutes = require("./routes/albumsRoutes");
const photosRoutes = require("./routes/photosRoutes");
const refreshRoutes = require("./routes/refreshRoutes");

const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/refresh", refreshRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/albums", albumsRoutes);
app.use("/api/photos", photosRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv://duy1:${process.env.MONGOOSE_PASSWORD}@cluster0.qgog7ng.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
