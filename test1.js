
const mongoose = require("mongoose");
const express = require("express");

const app = express();

mongoose
    .connect("mongodb://localhost:27017/my_KlabDB")
    .then(()=> console.log("MongoDB Connected"))
    .catch((err)=> console.error("MongoDB Connection Error: ", err));

const userSchema = new mongoose.Schema({
    name: {type: String, require: true},
    age: {type: Number},
    email: {type: String, unique: true},
    createdAt: {type: Date, default: Date.now},
    },
    { collection: "student"}
);

const user = mongoose.model("User", userSchema);

// document creation
const newUser = new user({name: "Gabo", age: 25, email: "prueba@gmail.com"});
await newUser.save();

// document retrieval
//const foundUsers = await User.find({age: { $gte: 20 } });

app.get("/students", async (req, res) => {
    const stundents = await User.find();
    res.json(stundents);
});

app.listen(3000, () => {
    console.log(" 💥 EXPRESS SERVER STARTED 💥: http://localhost:3000 ");
});