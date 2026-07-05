import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import { userRepository } from '../repositories/userRepository';
import { BadRequestError, UserUnauthorizedError } from '../utils/errors';
import prisma from '../config/db';
import { logger } from '../utils/logger';

export class AuthService {
  private generateAccessToken(user: { id: string; email: string; role: string }) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY as any }
    );
  }

  private generateRefreshToken(user: { id: string; email: string; role: string }) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRY as any }
    );
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      logger.warn(`Login failed: User with email "${normalizedEmail}" not found`);
      throw new UserUnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn(`Login failed: Password mismatch for email "${normalizedEmail}"`);
      throw new UserUnauthorizedError('Invalid email or password');
    }

    const roleName = user.role.name;
    const sessionUser = { id: user.id, email: user.email, role: roleName };

    const accessToken = this.generateAccessToken(sessionUser);
    const refreshToken = this.generateRefreshToken(sessionUser);

    await userRepository.updateRefreshToken(user.id, refreshToken);

    logger.info(`Login successful: User "${normalizedEmail}" logged in`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: roleName,
      },
    };
  }

  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await userRepository.findById(decoded.id);
      if (!user || user.refreshToken !== token) {
        throw new UserUnauthorizedError('Invalid refresh token');
      }

      const roleName = user.role.name;
      const sessionUser = { id: user.id, email: user.email, role: roleName };

      const accessToken = this.generateAccessToken(sessionUser);
      const newRefreshToken = this.generateRefreshToken(sessionUser);

      await userRepository.updateRefreshToken(user.id, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: roleName,
        },
      };
    } catch (error) {
      throw new UserUnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await userRepository.updateRefreshToken(userId, null);
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
    };
  }

  async register(fullName: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      logger.warn(`Registration failed: User with email "${normalizedEmail}" already exists`);
      throw new BadRequestError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    let agentRole = await prisma.role.findUnique({ where: { name: 'AGENT' } });
    if (!agentRole) {
      agentRole = await prisma.role.create({ data: { name: 'AGENT' } });
    }

    const user = await userRepository.createUser({
      email: normalizedEmail,
      fullName,
      passwordHash,
      roleId: agentRole.id,
    });

    const roleName = user.role.name;
    const sessionUser = { id: user.id, email: user.email, role: roleName };

    const accessToken = this.generateAccessToken(sessionUser);
    const refreshToken = this.generateRefreshToken(sessionUser);

    await userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: roleName,
      },
    };
  }
}

export const authService = new AuthService();
