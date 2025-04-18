const Listing = require("../models/listing.js");
const axios = require('axios');

module.exports.index = async (req, res, next) => {
  const { categories } = req.query;

  // If categories is selected and it's not "Trending", filter by that category
  const query = categories && categories !== "All" ? { categories } : {};

  // Fetch listings based on the query
  const allListings = await Listing.find(query);

  // Render the view with the filtered listings
  res.render("listings/index.ejs", { allListings });
};


module.exports.newroute = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showroute = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "The requested listing does not exist!");
    res.redirect("/listings");
  }
  let cuUser = res.locals.currUser;
  res.render("listings/show.ejs", { listing, cuUser: req.user });
};

module.exports.createroute = async (req, res) => {
  let url = req.file.path;
  let filename = req.url.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.editroute = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The requested listing does not exist!");
    res.redirect("/listings");
  }
  let orgImgUrl = listing.image.url;
  orgImgUrl = orgImgUrl.replace("/upload", "/upload/h_300,w_250");
  res.render("listings/edit.ejs", { listing , orgImgUrl });
};

module.exports.updateroute = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file != "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyroute = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
  const query = req.query.query || '';
  const regex = new RegExp(query, 'i');

  const listings = await Listing.find({
    $or: [
      { title: regex },
      { country: regex }
    ]
  });

  res.render('listings/index', { allListings: listings });
};