const { Model } = require('mongoose');

const passport =require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./models.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

    passport.use(new LocalStrategy({
        usernameField: 'Username',
        passwordField: 'Pass'
    }, async (username, password, done) => {
        console.log(username + ' ' + password);
        try {
            let user = await Users.findOne({Username: username});
            
            if (!user) {
                console.log('incorrect username');
                return done(null, false, {message: 'Incorrect username.'});
            }
            
            if (!user.validatePass(password)) {
                console.log('incorrect password');
                return done(null, false, {message: 'Incorrect password.'});
            }
            
            console.log('finished');
            return done(user);
        } catch (error) {
            console.log(error);
            return done(error);
        }
    }));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, (jwtPayload, callback) => {
    return Users.findById(jwtPayload._id)
    .then((user) => {
        return callback(null, user);
    })
    .catch((error) => {
        return callback(error)
    });
}));
