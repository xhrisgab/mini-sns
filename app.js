const express = require("express");
const chalk = require("chalk");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");

const app = express();

app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

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
        res.sendFile(path.join(__dirname, "public", "write.html"));
    } else {
        res.redirect("/");
    }
});

app.get("/posts", (req, res) => {
    const posts = [
        { username: "Tom", content: "Hello this is my first post!" },
        { username: "Alice", content: "Nice weather today." },
    ];

    if (req.session.username) {
        res.render("posts", { posts });
    } else {
        res.redirect("/");
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