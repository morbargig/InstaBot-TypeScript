export type environmentType = {
  users: ReadonlyArray<{
    username: string;
    password: string;
  }>;
  proxy?: string;
  testUser: string;
};
