import {Role} from '@prisma/client';

export const ROLE = {
  USER: 'USER' as Role,
  ADMIN: 'ADMIN' as Role,
};

export function hasRequiredRole(userRole: Role, required: Role[]){
    return required.includes(userRole)
}