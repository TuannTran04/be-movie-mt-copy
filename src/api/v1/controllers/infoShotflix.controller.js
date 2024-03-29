const { CREATED, SuccessResponse } = require("../core/success.response");
const InfoShotflixService = require("../services/infoShotflix.service");

class InfoShotflixController {
  getInfoShotflix = async (req, res) => {
    new SuccessResponse({
      message: "get Info Shotflix Success",
      metadata: await InfoShotflixService.getInfoShotflix(
        req.params,
        req.query
      ),
    }).send(res);
  };

  addInfoShotflix = async (req, res) => {
    new SuccessResponse({
      message: "add & edit Info Shotflix Success",
      metadata: await InfoShotflixService.addInfoShotflix(req.body),
    }).send(res);
  };
}

module.exports = new InfoShotflixController();
