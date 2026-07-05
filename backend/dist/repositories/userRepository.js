"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class UserRepository {
    async findByEmail(email) {
        return db_1.default.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }
    async findById(id) {
        return db_1.default.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }
    async updateRefreshToken(id, token) {
        return db_1.default.user.update({
            where: { id },
            data: { refreshToken: token },
        });
    }
    async createUser(data) {
        return db_1.default.user.create({
            data,
            include: { role: true },
        });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
