import { environment } from "../environment";
import { environmentType } from "../environment.type";

export const getUser = <
  U extends typeof environment["users"][number]["username"]
>(
  user: U
): environmentType["users"][number] => {
  return environment?.users?.find(
    (i) => i.username === user
  ) as environmentType["users"][number];
};
