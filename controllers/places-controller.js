const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");

const getCoordsForAddress = require("../util/location");
const uuid = require("uuid").v4;
const Place = require("../models/place");
const User = require("../models/user");
const { default: mongoose } = require("mongoose");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State Building",
    description: "famous buildingega",
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    address: "20 W 34th St, New York, NY 10001",
    creator: "u1",
  },
];

const getPlacebyId = async (req, res, next) => {
  const placeId = req.params.pid; //this gets the id of place written in url
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError("couldnt find place", 500);
    return next(err);
  }
  if (!place) {
    const error = new HttpError("Could not find such a place", 404);
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) }); //{place:place} == {place}
};

const getPlaceByUserId = async (req, res, next) => {
  const userId = req.params.uid; //this gets the id of place written in url
  let place;
  try {
    place = await Place.find({ creator: userId });
  } catch (error) {
    const err = new HttpError("action failed", 500);
    return next(err);
  }
  // const user = DUMMY_PLACES.filter((u) => {
  //   return userId == u.creator;
  // });
  if (!place || place.length === 0) {
    const error = new Error("Couldnt find such user id");
    error.code = 404;
    return next(error);
  }
  res.json({ place: place.map((p) => p.toObject({ getters: true })) }); //{place:place} == {place}
};
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("invalid inputs passed", 422));
  }

  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    console.log("coordinates error");
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    image: "asww",
    address,
    location: coordinates,
    creator,
  });
  let user;
  try {
    user = await User.findById(creator);
    //  console.log(user);
  } catch (error) {
    const err = new HttpError("create place failed.", 500);
    return next(err);
  }
  if (!user) {
    const err = new HttpError("couldnt find user for this place.", 500);
    return next(err);
  }
  //console.log(user);
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError("couldnt create place.", 500);
    return next(err);
  }
  res.status(201).json({ place: createdPlace });
};
const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new HttpError("invalid inputs passed", 422);
    return next(err);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid; //this gets the id of place written in url
  // const place = { ...DUMMY_PLACES.find((p) => placeId == p.id) };
  // const placeIndex = DUMMY_PLACES.findIndex((p) => placeId == p.id);
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError("couldnt update place", 500);
    return next(err);
  }
  place.title = title;
  place.description = description;
  // DUMMY_PLACES[placeIndex] = place;
  try {
    await place.save();
  } catch (error) {
    const err = new HttpError("couldnt save updated place", 500);
    return next(err);
  }
  res.status(200).json({ place: place.toObject({ getters: true }) }); //toObj to switch mongoose object to
  //normal JS object
};

const deletePLace = async (req, res, next) => {
  const { pid } = req.params;
  // if (!DUMMY_PLACES.find((p) => p.id === pid)) {
  //   throw new HttpError("couldnt find such place", 404);
  // }
  // DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== pid);
  let place;
  try {
    place = await Place.findById(pid).populate("creator");
  } catch (error) {
    const err = new HttpError("couldnt delete place", 500);
    return next(err);
  }
  if (!place) {
    const err = new HttpError("couldnt find such place", 404);
    return next(err);
  }
  try {
    await place.remove();
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.places.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError("couldnt delete chosen place", 500);
    return next(err);
  }
  res.status(200).json({ message: "deleted place" });
};

exports.getPlacebyId = getPlacebyId;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePLace = deletePLace;
