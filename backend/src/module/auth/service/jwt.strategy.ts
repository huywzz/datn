import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import { UserRepository } from '../../user/repository/user.repository';

@Injectable()
export class JwtStrategyService {
  private readonly logger = new Logger(JwtStrategyService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Verify JWT token
   * @param token - JWT token string
   * @returns Decoded token payload
   */
  async verifyToken(token: string): Promise<any> {
    try { 
      return await this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });
    } catch (err) {
      // this.logger.warn(err);
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  /**
   * Generate JWT token
   * @param payload - Token payload (userId, email, role)
   * @returns JWT token string
   */
  generateToken(payload: { sub: number; email: string; role: string }): string {
    const expiresInDays = this.configService.get<number>('JWT_EXPIRES_IN') || 7;
    const expiresIn = `${expiresInDays}d` as string;
    
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Validate token from request and return user
   * @param req - Express request object
   * @returns User object
   */
  async validateToken(req: Request): Promise<User> {
    try {
      const { authorization } = req.headers;
      let token = '';

      if (authorization && authorization.startsWith('Bearer')) {
        const split = authorization.split('Bearer ');
        if (split.length !== 2) {
          throw new UnauthorizedException('Invalid JWT token');
        }
        token = split[1];
      }

      if (!token) {
        throw new UnauthorizedException('Invalid JWT token');
      }

      const checkJwt = await this.verifyToken(token);

      if (!checkJwt || !checkJwt.sub) {
        throw new UnauthorizedException('Invalid JWT token');
      }

      const user = await this.userRepository.findOne({
        where: {
          userId: checkJwt.sub,
          status: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid JWT token');
      }

      if (checkJwt.role !== user.role) {
        throw new UnauthorizedException('Invalid JWT token');
      }

      return user;
    } catch (err) {
      // this.logger.warn(err);
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  /**
   * Validate token from ExecutionContext (for guards)
   * @param context - Execution context
   * @returns true if valid
   */
  async validate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = await this.validateToken(req);
    req.user = user;
    return true;
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string or null
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}
