const mongoDBConnectionString =
    "mongodb+srv://rubin:Tinu1234@cluster0.vfh7t.mongodb.net/blog-rubin?retryWrites=true&w=majority";
const HTTP_PORT = process.env.PORT || 8080;

const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const dataService = require("./modules/data-service.js");
const data = dataService(mongoDBConnectionString);
const app = express();
app.use(bodyParser.json());
app.use(cors());

const jwtOptions = {
    jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    secretOrKey: "0KHEINdnUmZyJaiRvN5088mMHrh&PNEpsD9%M!r4y0zs9d#IB0",
};

const strategy = new passportJWT.Strategy(jwtOptions, function (
    jwt_payload,
    next
) {
    if (jwt_payload) {
        next(null, {
            _id: jwt_payload._id,
            userName: jwt_payload.userName,
        });
    } else {
        next(null, false);
    }
});
passport.use(strategy);
app.use(passport.initialize());

app.post(
    "/api/posts",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        data
            .addNewPost(req.body)
            .then((msg) => {
                res.json({ message: msg });
            })
            .catch((err) => {
                res.json({ message: `an error occurred: ${err}` });
            });
    }
);

// IMPORTANT NOTE: ?tag=#funny wll not function, but ?tag=funny will
app.get("/api/posts", (req,res) => {
    data.getAllPosts(req.query.page, req.query.perPage, req.query.category, req.query.tag).then((data)=>{
        res.json(data);
    })
    .catch((err)=>{
        res.json({message: `an error occurred: ${err}`});
    })
});

app.get("/api/categories", (req,res)=>{
    data.getCategories().then((data)=>{
        res.json(data);
    })
    .catch((err)=>{
        res.json({message: `an error occurred: ${err}`});
    })
});

app.get("/api/tags", (req,res)=>{
    data.getTags().then((data)=>{
        res.json(data);
    })
    .catch((err)=>{
        res.json({message: `an error occurred: ${err}`});
    })
});

app.get("/api/posts/:id",(req,res)=>{
    data.getPostById(req.params.id).then(data=>{
        res.json(data);
    }).catch((err)=>{
        res.json({message: `an error occurred: ${err}`});
    });
});

app.put(
    "/api/posts/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        data
            .updatePostById(req.body, req.params.id)
            .then((msg) => {
                res.json({ message: msg });
            })
            .catch((err) => {
                res.json({ message: `an error occurred: ${err}` });
            });
    }
);

app.delete(
    "/api/posts/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        data
            .deletePostById(req.params.id)
            .then((msg) => {
                res.json({ message: msg });
            })
            .catch((err) => {
                res.json({ message: `an error occurred: ${err}` });
            });
    }
);

app.post("/api/user/login", (req, res) => {
    data
        .login(req.body)
        .then((user) => {
            const payload = {
                _id: user._id,
                userName: user.userName,
            };

            const token = jwt.sign(payload, jwtOptions.secretOrKey);
            res.json({ message: "login successful", token: token });
        })
        .catch((err) => {
            res.status(400);
            res.json({ message: err });
        });
});

app.post("/api/user/register", (req, res) => {
    data
        .registerUser(req.body)
        .then((message) => {
            res.json({ message });
        })
        .catch((err) => {
            res.status(400);
            res.json({ message: err });
        });
});

// Connect to the DB and start the server

data.connect().then(()=>{
    app.listen(HTTP_PORT, ()=>{console.log("API listening on: " + HTTP_PORT)});
})
.catch((err)=>{
    console.log("unable to start the server: " + err);
    process.exit();
});
