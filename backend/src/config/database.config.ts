/**
 * MongoDB connection settings. `MONGODB_URI` is required for production; a local
 * default is provided for development only.
 */
export const databaseConfig = {
  get uri(): string {
    return (
      process.env.MONGODB_URI ??
      'mongodb://127.0.0.1:27017/codematicticketsystem'
    );
  },
};
