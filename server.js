require('dotenv').config();

const express = require('express'),
 bodyParser = require('body-parser'),
 uuid = require('uuid');
 
const { check, validationResult } = require('express-validator');

const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

// replace the hardcoded connection string with the environment variable
const mongoURI = process.env.CONNECTION_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to mongodb');
  })
  .catch((err) => {
    console.error('failed to connect :(', err);
  });

  const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
 });


app.use(morgan("common"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'https://movie-apis-84b92f93a404.herokuapp.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application does not allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));


let auth = require('./auth.js')(app);

const passport = require('passport');
require('./passport.js');


app.get('/', (req, res) => {
  res.send('welcome to my movie API');
});


// get movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.find()
		.then((movies) => {
			res.status(201).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movies) => {
      if (!movies) {
        return res.status(404).send("movie doesn't exist");
      }
      res.json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//adds movie
app.post('/movies',  passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.body.Title })
  .then((movie) => {
    if (movie) {
      return res.status(400).send(req.body.Title + " already exists");
    } else {
      Movies
        .create({
          Title: req.body.Title,
          Description: req.body.Description,
          Genre: {
            Name: req.body.Name,
            Description: req.body.Description
          },
          Director: {
            Name: req.body.Name,
            Bio: req.body.Description
          }})
        .then((user) =>{res.status(201).json(user) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//deletes movie
app.delete('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOneAndDelete({ Title: req.params.Title })
    .then((user) => {
      if (!user) {
        res.status(404).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err.message);
    });
});


//get users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//get users by ID
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        return res.status(404).send("user doesn't exist");
      }
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//make new user
app.post('/users', passport.authenticate('jwt', { session: false }), [
  check('Username', 'add a username').isLength({min: 5}),
  check('Username', 'non alphanumeric characters not allowed, go hack someone else').isAlphanumeric(),
  check('Pass', 'add a password').not().isEmpty(),
  check('Email', 'invalid email').isEmail()
], (req, res) => {
  //check validation for errors
  let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

  let hashedPass = Users.hashPass(req.body.Pass);
  Users.findOne({ Username: req.body.Username })
  .then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + 'already exists');
    } else {
      Users
        .create({
          Username: req.body.Username,
          Pass: hashedPass,
          Email: req.body.Email,
          Birthdate: req.body.Birthdate
        })
        .then((user) =>{res.status(201).json(user) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//update username
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }); // updated document return

    if (!updatedUser) {
      return res.status(404).send("Error: User doesn't exist");
    }

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});


//delete user by name
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(404).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err.message);
    });
});

//add favorite movie
app.put('/users/:username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.Username },
      {
        $addToSet: { FavoriteMovies: req.params.MovieID }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("Error: User doesn't exist");
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

//delete fav movie
app.delete('/users/:username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndDelete(
      { username: req.params.Username },
      {
        $addToSet: { FavoriteMovies: req.params.MovieID }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("Error: User doesn't exist");
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});


  

//get genres
app.get('/genres', passport.authenticate('jwt', { session: false }), (req, res) => {
  Genres.find()
    .then((genres) => {
      res.status(201).json(genres);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//get genre by ID
app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Genres.findOne({ Name: req.params.Name })
    .then((genre) => {
      if (!genre) {
        return res.status(404).send("genre doesn't exist");
      }
      res.json(genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//post genre
app.post('/genres', passport.authenticate('jwt', { session: false }), (req, res) => {
  Genres.findOne({ Name: req.body.Name })
  .then((genres) => {
    if (genres) {
      return res.status(400).send(req.body.Name + " already exists");
    } else {
      Genres
        .create({
          Name: req.body.Name,
          Description: req.body.Description
        })
        .then((genres) =>{res.status(201).json(genres) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//get directors
app.get('/directors', passport.authenticate('jwt', { session: false }), (req, res) => {
	Directors.find()
		.then((directors) => {
			res.status(201).json(directors);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//get directors by ID
app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Directors.findOne({ Name: req.params.Name })
    .then((directors) => {
      if (!directors) {
        return res.status(404).send("director doesn't exist");
      }
      res.json(directors);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//add new director
app.post('/directors', passport.authenticate('jwt', { session: false }), (req, res) => {
  Directors.findOne({ Name: req.body.Name })
  .then((directors) => {
    if (directors) {
      return res.status(400).send(req.body.Name + " already exists");
    } else {
      Directors
        .create({
          Name: req.body.Name,
          Bio: req.body.Bio,
          Birth: req.body.Birth
        })
        .then((directors) =>{res.status(201).json(directors) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//documentation
app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', {root: __dirname});
});

//set up server
app.use((err, res) => {
  console.error(err.stack);
  res.status(500).send('it BROKE :( try again');
});
