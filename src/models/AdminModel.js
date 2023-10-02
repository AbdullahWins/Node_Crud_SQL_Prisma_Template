const { ObjectID } = require("mongodb");
const { adminsCollection } = require("../../config/database/db");

class AdminModel {
  constructor(
    id,
    firstName,
    lastName,
    email,
    password,
    permissions,
    status,
    timestamp
  ) {
    this._id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.permissions = permissions;
    this.status = status;
    this.timestamp = timestamp;
  }

  static async findByEmail(email) {
    const admin = await adminsCollection.findOne({ email: email });
    return admin;
  }

  static async findById(id) {
    console.log(id);
    const admin = await adminsCollection.findOne({ _id: ObjectID(id) });
    return admin;
  }

  static async createAdmin(
    firstName,
    lastName,
    email,
    password,
    permissions,
    status,
    timestamp
  ) {
    const newAdmin = {
      firstName,
      lastName,
      email,
      password,
      permissions,
      status,
      timestamp,
    };
    const result = await adminsCollection.insertOne(newAdmin);
    const createdAdmin = {
      _id: result.insertedId,
      ...newAdmin,
    };
    return createdAdmin;
  }
}

module.exports = AdminModel;
