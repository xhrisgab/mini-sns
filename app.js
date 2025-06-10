const express = require("express");
const chalk = require("chalk");
const path = require("path");
const mongoose = require("mongoose");
const morgan = require("morgan");
const session = require("express-session");

const Feed = require("./model/feed");


const app = express();

app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

mongoose
    .connect("mongodb+srv://user_32:Chr1s.23@cluster0.uj2zehx.mongodb.net/students")
    .then(() => console.log(chalk.bgHex("#b2ebf2").black.bold(" ⛅ MongoDB Connected ⛅ ")))
    .catch((err) => console.error("MongoDB Connection Error: ", err));

/* // Sample code to create anew feed
const sampleFeed = new Feed({
    content: "This is my first SNS feed!",
    author: "TEST_USER",
}); 

sampleFeed
    .save()
    .then(() => console.log("✅ Test fed saved"))
    .then(() => {
        Feed.find().then((feeds) => {
            console.log(feeds);
        });
    })
    .catch((err) => console.error("❌ Error:", err));
 */
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

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    //mock authentication login
    const mockUsername = "xhris";
    const mockPassword = "123456";

    if (username === mockUsername && password === mockPassword) {
        req.session.username = username;
        res.redirect("/posts");
    } else {
        res.send("Login failed!");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) { return res.send("Error logging out"); }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

app.listen(3000, () => {
    console.log(chalk.bgHex("#ff69b4").white.bold(" 💥 EXPRESS SERVER STARTED 💥 "));
    console.log(chalk.green("Running at: ") + chalk.cyan("http://localhost:3000"));
    console.log(chalk.gray("Press Ctrl+C to stop the server."));
});