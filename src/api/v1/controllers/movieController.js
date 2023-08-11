const Movie = require("../models/Movie");
const User = require("../models/User");
const AppError = require("../utils/appError");

const movieController = {
  
    getAllMovies: async (req, res) => {
        try {
         const movie = await Movie.find();
            res.status(200).json(movie);
        } catch (err) {
        res.status(500).json(err);
        }
    },
    addMovie: async (req, res) => {
    //     title: {
    //     type:String,
    //     require: true,
    //     min: 6,
    // },
    // desc: {
    //     type:String,
    //     require: true,
    //     min: 6,
    // },
    // author: {
    //     type:String,
    //     require: true,
    //     min: 6,
    // },
    // photo : [
    //     String
    // ],
    // category: [String],
    // video: [String],
    // trailer: [String],
    // rating: {
    //     type: Number,
    //     default: 0
    // },
    // quality: {
    //   type: String,
    //   enum: {
    //     values: ['hd', 'cam', 'fullhd'],
    //     message: 'Difficulty is either: hd, cam, fullhd'
    //   }
    // },
    // yearPublish: Number,
    // timeVideo: String,
    // country: String,
    // actors: [String]
        // let {title, desc, author} = req.body;
        try {
            const newMovie = await new Movie({...req.body});
            if(!newMovie) {
                throw new AppError("not have new movie", 401)
            }
            const movie = await newMovie.save()
            res.status(200).json({
                code: 'ok',
                data: movie
            })
            // console.log("check newmovie",newMovie)
            // const user = await newUser.save();
        }catch(err) {
            console.log("check err",err)
            throw new AppError(err.message, err.status)
        }
    }
//   //DELETE A USER
//   deleteUser: async (req, res) => {
//     try {
//       await User.findByIdAndDelete(req.params.id);
//       res.status(200).json("User deleted");
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   },
};

module.exports = movieController;
