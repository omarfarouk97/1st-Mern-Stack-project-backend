const APIKEY = "AIzaSyAPmYm-LA98n3yO0MTQpWW8DgkKM09_ow8";
const axios = require("axios");

const HttpError = require("../models/http-error");

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${APIKEY}`
  );
  const data = response.data;
  console.log(data);
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError("cant find location for this address", 422);
    throw error;
  }
  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

module.exports = getCoordsForAddress;
