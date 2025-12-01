import { CanActivate, ExecutionContext, Inject, Type, mixin } from '@nestjs/common';
import { User } from 'src/module/user/entities/user.entity';
import { Repository } from 'typeorm';
import { USER_REPOSITORY } from '../../../common/constant/repository';
import { UserRole } from '../../../common/constant/enum';

const RoleGuard = (...roles: UserRole[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    constructor(@Inject(USER_REPOSITORY) private userRepository: Repository<User>) {}
    async canActivate(context: ExecutionContext) {
      const { user } = context.switchToHttp().getRequest();

      if (!user) {
        return false; // User not authenticated
      }

      const userData = await this.userRepository.findOne({
        where: {
          userId: user.userId,
        },
      });

      if (!userData) {
        return false;
      }
      // Check if the user has the required roles
      return roles.some(role => role === userData.role);
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;
