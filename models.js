const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const movieSchema = mongoose.Schema({
  _id: {
    $oid: String
  },
  Title: {type: String, required: true},
  Description: {type: String, required: true},
  Genre: {
    Name: String,
    Description: String
  },
  Director: {
    Name: String,
    Bio: String
  },
  Actors: [String],
  ImagePath: String,
  Featured: Boolean
});

const userSchema = mongoose.Schema({
  Username: {type: String, required: true},
  Pass: {type: String, required: true},
  Email: {type: String, required: true},
  Birthdate: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});
userSchema.statics.hashPass = (password) => {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePass = function(password) {
  return bcrypt.compareSync(password, this.Pass);
};

const directorSchema = mongoose.Schema({
  Name: {type: String, required: true},
  Bio: {type: String, required: true},
  Birth: Number
});

const genreSchema = mongoose.Schema({
  Name: {type: String, required: true},
  Description: {type: String, required: true}
});

const Movie = mongoose.model('movies', movieSchema);
const User = mongoose.model('User', userSchema);
const Director = mongoose.model('Director', directorSchema);
const Genre = mongoose.model('Genre', genreSchema);

module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Director = Director;
module.exports.Genre = Genre;