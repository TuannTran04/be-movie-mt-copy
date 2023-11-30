const Shotflix = require("../models/Shotflix");

const _ = require("lodash");
const { ObjectId } = require("mongodb");

const commentController = {
  getInfoShotflix: async (req, res) => {
    // console.log(">>> getInfoShotflix ;<<<", req.body);
    try {
      let query = {};
      //   if (recipientId) {
      //     query.recipient = new ObjectId(recipientId);
      //   }

      let infoShotflix = await Shotflix.find({});

      res.status(200).json({
        code: 200,
        mes: "lấy info thành công",
        data: infoShotflix,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },
  addInfoShotflix: async (req, res) => {
    console.log(">>> addInfoShotflix: <<<", req.body);

    const author = req.body.author.split(",");
    const photo = req.body.photo.split(",");
    const logo = req.body.logo.split(",");
    const keyword = req.body.keyword.split(",");

    console.log(author);
    console.log(photo);
    console.log(logo);
    console.log(keyword);

    try {
      // const newInfoShotflix = new Shotflix({
      //   ...req.body,
      //   author,
      //   photo,
      //   logo,
      //   keyword,
      // });

      const newInfoShotflix = await Shotflix.findOneAndUpdate(
        { _id: req.body.id },
        {
          ...req.body,
          author,
          photo,
          logo,
          keyword,
        },
        { new: true }
      );

      if (!newInfoShotflix) {
        throw new AppError("not have new info", 401);
      }

      const infoShotflix = await newInfoShotflix.save();

      res.status(200).json({
        message: "Thêm thông tin thành công",
        // data: movie,
      });
    } catch (err) {
      console.log("check err", err);
      // throw new AppError(err.message, err.status);
      res.status(404).json({
        code: 404,
        mes: "Lỗi!!!!",
        err,
      });
    }
  },
};

module.exports = commentController;
