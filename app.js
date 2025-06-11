const express = require("express");
const chalk = require("chalk");
const path = require("path");
const mongoose = require("mongoose");
const morgan = require("morgan");
const session = require("express-session");
const bcrypt = require("bcrypt");

const Feed = require("./model/feed");
const User = require("./model/user");


const app = express();

app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

mongoose
    .connect("mongodb+srv://user_32:Chr1s.23@cluster0.uj2zehx.mongodb.net/students")
    .then(() => console.log(chalk.bgHex("#b2ebf2").black.bold(" ⛅ MongoDB Connected ⛅ ")))
    .catch((err) => console.error("MongoDB Connection Error: ", err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("common"));
app.use(session({
    secret: "myPass123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 5,
    }, // 5 minutos
}));

app.get("/", (req, res) => {
    //res.sendFile(path.join(__dirname, "public", "index.html"));
    res.render("index", { username: req.session.username });
});

app.use(express.urlencoded({ extended: true }));

app.get("/write", (req, res) => {
    if (req.session.username) {
        res.render("write",);
    } else {
        res.redirect("/");
    }
});

app.post("/write", async (req, res) => {
    const { content } = req.body;
    if (!req.session.username) {
        res.redirect("/");
    }

    const newFeed = new Feed({
        content,
        author: req.session.username,
    });
    // Save the new feed to the database
    // and redirect to the posts page 
    await newFeed
        .save()
        .then(() => {
            console.log("Feed saved successfully");
            res.redirect("/posts");
        })
        .catch((err) => {
            console.error("Error saving feed:", err);
            res.status(500).send("Error saving feed");
        });
});

app.get("/posts", async (req, res) => {
    if (!req.session.username) {
        return res.redirect("/");
    }
    try {
        const posts = await Feed.find({ author: req.session.username }).sort({
            createdAt: -1,
        }); // sort by createdAt in descending order.
        res.render("posts", { posts });
    } catch (error) {
        console.error("Error loading posts", err);
        res.status(500).send("Error loading posts");
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.send("Invalid username or password!");
        }
        req.session.username = username;
        res.redirect("/posts");
    } catch (err) {
        console.error("Error during login: ", err);
        res.status(500).send("Error during login!");

    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) { return res.send("Error logging out"); }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

app.get("/register", (req, res) => {
    res.render("register",);
});

app.post("/register", async (req, res) => {
    const { username, password, name } = req.body;

    try {
        const existUser = await User.findOne({ username });
        if (existUser) {
            return res.send("Username already exist");
        }

        const newUser = new User({ username, password, name });
        await newUser.save();
        res.redirect("/");
    } catch (err) {
        console.error("Error during register", err);
        res.status(500).send("Error during reguister");

    }
});

app.get("/friends/list", async (req, res) => {
    if (!req.session.username) {
        return res.redirect("/");
    }
    try {
        const user = await User.findOne({ username: req.session.username });
        res.render("friends", {
            friends: user.friends,
            findedfriends: []
        });
    } catch (err) {
        console.error("Error fetching friends list:", err);
        res.status(500).send("Error fetching friends list");
    }
});

app.post("/friends/search", async (req, res) => {
    const { friendUsername } = req.body;
    if (!req.session.username) {
        return res.redirect("/");
    }
    try {
        // Se arc h for the logge d-in use r
        const user = await User.findOne({
            usernam: req.session.username
        });
        // Search for users whose username includes the search term
        const findedfriends = await User.find({
            $and: [
                // includes search term
                { username: { $regex: friendUsername, $options: "i" } },
                // exclude already added friends and self
                { username: { $nin: [...user.friends, user.username] } },
            ],
        });
        res.render("friends", { friends: user.friends, findedfriends });
    } catch (err) {
        console.error("Error searching for friends:", err);
        res.status(500).send("Error se arching for friends");
    }
});

app.post("/friends/add", async (req, res) => {
    const { friendUsername } = req.body;
    if (!req.session.username) {
        return res.redirect("/");
    }
    try {
        const user = await User.findOne({
            username:
                req.session.username
        });
        const friend = await User.findOne({
            username:
                friendUsername
        });
        if (!friend) {
            return res.send("User not found!");
        }
        if (user.friends.includes(friend.username)) {
            return res.send("Already friends!");
        }
        user.friends.push(friend.username);
        await user.save();
        res.redirect("/friends/list");
    } catch (err) {
        console.error("Error adding friend:", err);
        res.status(500).send("Error adding friend");
    }
});

app.listen(3000, () => {
    console.log(chalk.bgHex("#ff69b4").white.bold(" 💥 EXPRESS SERVER STARTED 💥 "));
    console.log(chalk.green("Running at: ") + chalk.cyan("http://localhost:3000"));
    console.log(chalk.gray("Press Ctrl+C to stop the server."));
});