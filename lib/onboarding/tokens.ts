import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

export const createApplicationToken = () =>
  randomBytes(32).toString('base64url');

export const hashApplicationToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const createPublicApplicationId = () =>
  `DST-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
