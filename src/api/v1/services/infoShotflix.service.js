"use strict";
const Shotflix = require("../models/shotflix.model");
const _ = require("lodash");

const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");
const { getRedis } = require("../connections/init.redis");
const { getKeyString, setKeyString } = require("./redis.service");
const { instanceConnect: redisClient } = getRedis();

class InfoShotflixService {
  static getInfoShotflix = async (req, res) => {
    let query = {};
    //   if (recipientId) {
    //     query.recipient = new ObjectId(recipientId);
    //   }

    let infoShotflixCache = await getKeyString(`dataInfoShotflixCache`);
    if (infoShotflixCache !== null) {
      const dataInfoShotflixParse = JSON.parse(infoShotflixCache);
      console.log("dataInfoShotflixParse >>", typeof dataInfoShotflixParse);

      return {
        data: dataInfoShotflixParse,
      };
    }

    let infoShotflix = await Shotflix.find({});

    await setKeyString({
      key: "dataInfoShotflixCache",
      value: infoShotflix,
      expire: 300,
    });

    return {
      data: infoShotflix,
    };
  };

  static addInfoShotflix = async (data) => {
    console.log(">>> addInfoShotflix: <<<", data);

    const author = data.author.split(",");
    const photo = data.photo.split(",");
    const logo = data.logo.split(",");
    const keyword = data.keyword.split(",");

    console.log(author);
    console.log(photo);
    console.log(logo);
    console.log(keyword);

    // const newInfoShotflix = new Shotflix({
    //   ...data,
    //   author,
    //   photo,
    //   logo,
    //   keyword,
    // });

    const newInfoShotflix = await Shotflix.findOneAndUpdate(
      { _id: data.id },
      {
        ...data,
        author,
        photo,
        logo,
        keyword,
      },
      { new: true }
    );

    if (!newInfoShotflix) {
      throw new BadRequestError("not have new info", 404);
    }

    const infoShotflix = await newInfoShotflix.save();

    return {
      message: "Thêm thông tin thành công",
      // data: movie,
    };
  };
}

module.exports = InfoShotflixService;
