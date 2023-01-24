require("dotenv").config();

const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet"),
  passport = require("passport"),
  cookieParser = require("cookie-parser"),
  methodOverride = require("method-override"),
  session = require("express-session"),
  path = require("path"),
  MongoStore = require("connect-mongo"),
  bodyParser = require("body-parser");

const db = require("./db"),
  routes = require("./app/routes"),
  config = require("./app/config");

const app = express(),
  nodeEnv = process.env.NODE_ENV,
  // cookieSecret =
  port = process.env.PORT || 5000,
  User = db.user;

db.connect();

var whitelist = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];

var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
// app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json()); //req.body
app.use(cookieParser(config.cookieSecretKey));
app.use(bodyParser.json({ limit: "80mb" }));
app.use(
  express.urlencoded({ limit: "80mb", parameterLimit: 1000000, extended: true })
);

// app.all('/*', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// });

app.use(
  session({
    secret: config.cookieSecretKey,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      path: "/",
      maxAge: config.cookieSessionExpiration,
      secure: config.isProduction,
    },
  })
);

require("./app/services/localStrategy")(passport);
require("./app/services/googleStrategy")(passport);
require("./app/services/jwtStrategy")(passport);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      username: user.username,
      name: user.name,
      Shop: user.Shop?._id,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

// app.disable("x-powered-by");

app.use(routes);
app.listen(port, () => {
  console.log(`server has started on port ${port}`);
});
