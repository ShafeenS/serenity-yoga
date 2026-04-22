// models/userModel.js
import { usersDb } from "./_db.js";

export const UserModel = {
  async create(user) { return usersDb.insert(user); },
  async findByEmail(email) { return usersDb.findOne({ email }); },
  async findById(id) { return usersDb.findOne({ _id: id }); },
  async list(filter = {}) { return usersDb.find(filter); },
  async update(id, patch) {
    await usersDb.update({ _id: id }, { $set: patch });
    return this.findById(id);
  },
  async delete(id) { return usersDb.remove({ _id: id }, {}); },
};
