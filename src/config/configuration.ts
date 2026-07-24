export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,

  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,

  mailHost: process.env.MAIL_HOST,
  mailPort: Number(process.env.MAIL_PORT),
  mailUser: process.env.MAIL_USER,
  mailPassword: process.env.MAIL_PASSWORD,
  mailFrom: process.env.MAIL_FROM,
});
