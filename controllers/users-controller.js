const uuid = require("uuid").v4;
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "omar ahmed",
    email: "sheka@mazika.com",
    password: "secret",
  },
];

const getUsersList = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    const err = new HttpError("couldnt get users", 500);
    return next(err);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("invalid inputs passed", 422));
  }
  const { name, email, password } = req.body;

  // const checkUser = DUMMY_USERS.find((u) => u.email === email);
  // if (checkUser) {
  //   throw new HttpError("email already exists, try a different one", 422);
  // }
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    const err = new HttpError("couldnt sign up at the moment", 500);
    return next(err);
  }
  if (existingUser) {
    const error = new HttpError("email already exists", 401);
    return next(error);
  }
  const createdUser = new User({
    name,
    email,
    password,
    image: "meow",
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    const err = new HttpError("sign up failed :(", 500);
    return next(err);
  }
  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  // const identifiedUser = DUMMY_USERS.find((u) => u.email === email);

  // if (!identifiedUser) {
  //   throw new HttpError("no such email registered", 401);
  // }
  // if (identifiedUser.password !== password) {
  //   throw new HttpError("incorrect password", 401);
  // }
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    const err = new HttpError("couldnt login", 500);
    return next(err);
  }
  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError("invalid credentials", 401);
    return next(error);
  }
  res.json({
    message: "logged in",
    user: existingUser.toObject({ getters: true }),
  });
};

exports.getUsersList = getUsersList;
exports.signup = signup;
exports.login = login;
