//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser : true });
const ItemsSchema = {
    name: String
};
const Item = mongoose.model("item", ItemsSchema);
const Item1 = new Item({
    name: "Welcome to the to do list!"
});
const Item2 = new Item({
    name: "Hit the + button to add a new item"
});
const Item3 = new Item({
    name: "<-- Hit this to delete an item"
});
const defaultItems = [Item1, Item2, Item3];

const listSchema = {
    name: String,
    items: [ItemsSchema]
};
const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved Items into the to do list database");
                }
            });
            res.redirect("/")
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.get("/:customListName", function (req, res) {
    customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, foundLists) {
        if (!err) {
            if (!foundLists) {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                //Show an existing list
                res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items})
            }
        }
    });
});


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function (err, foundLists) {
            foundLists.items.push(item);
            foundLists.save();
            res.redirect("/" + listName);
        });
    }
    
});


app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Item has been successfully deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundLists) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});

//Running the server in the required port 3000
app.listen(3000, function () {
    console.log("Server is currently running on port 3000");
});