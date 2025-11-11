import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtStrategyService } from '../service/jwt.strategy';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtStrategyService: JwtStrategyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return await this.jwtStrategyService.validate(context);
  }
}

