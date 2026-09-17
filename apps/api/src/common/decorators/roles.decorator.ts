import { SetMetadata } from "@nestjs/common";
import { Role } from "@truyenkomi/database";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
