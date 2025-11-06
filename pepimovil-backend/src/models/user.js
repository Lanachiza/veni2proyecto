import { getStore } from '../config/db.js';
const users = getStore('users');
export async function upsertUser(user) {
  users.set(user.id, user);
  return user;
}
export async function getUserById(id) {
  return users.get(id) || null;
}

