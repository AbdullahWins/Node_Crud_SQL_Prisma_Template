const { ObjectID } = require("mongodb");
const { usersCollection } = require("../../config/database/db");

class UserModel {
  constructor(id, firstName, lastName, email, password, price, timestamp) {
    this._id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.price = price;
    this.timestamp = timestamp;
  }

  static async findByEmail(email) {
    const user = await usersCollection.findOne({ email: email });
    return user;
  }

  static async findById(id) {
    console.log(id);
    const user = await usersCollection.findOne({ _id: ObjectID(id) });
    return user;
  }

  static async createUser(
    firstName,
    lastName,
    email,
    password,
    price,
    timestamp
  ) {
    const newUser = { firstName, lastName, email, password, price, timestamp };
    console.log(newUser);
    const result = await usersCollection.insertOne(newUser);
    const createdUser = {
      _id: result.insertedId,
      ...newUser,
    };
    return createdUser;
  }
}

module.exports = UserModel;
