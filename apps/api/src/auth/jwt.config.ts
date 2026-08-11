import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'sapay-dev-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '12h'
}));