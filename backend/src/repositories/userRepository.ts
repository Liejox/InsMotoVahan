import prisma from '../config/db';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async updateRefreshToken(id: string, token: string | null) {
    return prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
  }

  async createUser(data: { email: string; fullName: string; passwordHash: string; roleId: string }) {
    return prisma.user.create({
      data,
      include: { role: true },
    });
  }
}

export const userRepository = new UserRepository();
