// Controllers/falajController.js

const { ObjectId } = require("mongodb");
const { girlFriendsCollection } = require("../../config/database/db");
const { Timekoto } = require("timekoto");
const { uploadFile } = require("../utilities/uploadFile");

//get all GirlFriend
const getAllGirlFriends = async (req, res) => {
  try {
    const query = {};
    const cursor = girlFriendsCollection.find(query);
    const falajes = await cursor.toArray();
    if (falajes.length === 0) {
      return res.send([]);
    }
    res.send(falajes);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server Error" });
  }
};

//get single GirlFriend
const getOneGirlFriend = async (req, res) => {
  try {
    const falajId = req.params.id;
    const falaj = await girlFriendsCollection.findOne({
      _id: new ObjectId(falajId),
    });
    if (!falaj) {
      res.status(404).send({ error: "falaj rent not found" });
    } else {
      res.send(falaj);
      console.log(falaj);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server Error" });
  }
};

//get GirlFriend By type
const getGirlFriendsByType = async (req, res) => {
  try {
    const type = req.params.type;
    const response = girlFriendsCollection.find({
      type: type,
    });
    const GirlFriendDetails = await response.toArray();
    if (!GirlFriendDetails) {
      res.status(404).send({ error: "gf not found on this type" });
    } else {
      console.log(GirlFriendDetails);
      res.send(GirlFriendDetails);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server Error" });
  }
};

//add new GirlFriend
const addOneGirlFriend = async (req, res) => {
  try {
    const { file } = req;
    const data = JSON.parse(req?.body?.data);
    const { name, age, location, pros, cons, type, status } = data;
    //validate inputs
    if (!name || !age || !location || !pros || !cons || !type || !status) {
      return res.status(400).send("Incomplete Inputs");
    }
    //formatdata
    let formattedData = {
      name,
      age,
      location,
      pros,
      cons,
      type,
      status,
      timestamp: Timekoto(),
    };

    //upload file
    if (file) {
      const folderName = "GirlFriends";
      const image = await uploadFile(file, folderName);
      console.log(image);
      formattedData = { ...formattedData, image };
    }
    //store data on database
    const result = await girlFriendsCollection.insertOne(formattedData);
    if (result?.acknowledged === false) {
      return res.status(500).send({ error: "Failed to add gf" });
    }
    res.send(formattedData);
    console.log(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to add gf" });
  }
};

//update one GirlFriend
const updateGirlFriendById = async (req, res) => {
  try {
    const id = req.params.id;
    const { file } = req;
    const query = { _id: new ObjectId(id) };
    const data = JSON.parse(req?.body?.data);
    let formattedData = { ...data };

    //upload file
    if (file) {
      const folderName = "GirlFriends";
      const image = await uploadFile(file, folderName);
      console.log(image);
      formattedData = { ...formattedData, image };
    }

    if (!formattedData) {
      return res.status(400).send({ error: "Incomplete Inputs" });
    }

    const result = await girlFriendsCollection.updateOne(query, {
      $set: formattedData,
    });
    if (result?.modifiedCount === 0) {
      return res.status(500).send({ error: "No modifications were made" });
    }
    res.send(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update gf" });
  }
};

//delete one GirlFriend
const deleteOneGirlFriendById = async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await girlFriendsCollection.deleteOne(query);
    console.log(result);
    if (result?.deletedCount === 0) {
      console.log("no gf found with this id:", id);
      res.send({ error: "no gf found with this id!" });
    } else {
      console.log("gf deleted:", id);
      res.status(200).send(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to delete falaj rent" });
  }
};

module.exports = {
  getAllGirlFriends,
  getOneGirlFriend,
  getGirlFriendsByType,
  addOneGirlFriend,
  updateGirlFriendById,
  deleteOneGirlFriendById,
};
