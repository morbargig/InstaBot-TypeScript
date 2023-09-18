import Fs from "fs/promises";
import Prompt from "prompt";
import {
  AccountFollowersFeedResponseUsersItem,
  AccountFollowingFeedResponseUsersItem,
  AccountRepositoryLoginResponseLogged_in_user,
  Feed,
  IgApiClient,
} from "instagram-private-api";
import { getUser } from "./helpers/get-user";

const { username: IG_USERNAME, password: IG_PASSWORD } = getUser(
  "miryam_bargig"
);

/**
 * @see: https://github.com/dilame/instagram-private-api/issues/969#issuecomment-551436680
 * @param feed
 * @returns Promise<T[]> - T is the type of all feed items.
 */
async function getAllItemsFromFeed<T>(feed: Feed<any, T>) {
  let items: T[] = [];

  do {
    const feedItems = await feed.items();
    items = items.concat(feedItems);
  } while (feed.isMoreAvailable());

  return items;
}

/**
 * Store users data into a json file.
 * Wanna to get detail of users? just pass the 'data' through JSON.stringify instead of 'mappedData'
 * @param fileName
 * @param data
 * @returns Promise<void>
 */
function storeJSON(
  fileName: string,
  data:
    | AccountFollowingFeedResponseUsersItem[]
    | AccountFollowersFeedResponseUsersItem[]
) {
  const mappedData = data.map((user) => user.username);
  return Fs.writeFile(fileName, JSON.stringify(mappedData, null, 2));
}

async function unfollowUsers(
  ig: IgApiClient,
  notFollowBackYou: AccountFollowingFeedResponseUsersItem[]
) {
  for (const user of notFollowBackYou) {
    await ig.friendship.destroy(user.pk);
    console.log(`> Unfollowed ${user.username}`);
    // const time = Math.round(Math.random() * 60000) + 1000;
    // console.log(`Waiting ${time}ms`);
    // await new Promise((resolve) => setTimeout(resolve, time));
    // console.log("Finished waiting");
  }
}

export async function check(username?: string) {
  console.info("> Setup Instagram Client...");
  const ig = new IgApiClient();
  ig.state.generateDevice(IG_USERNAME);
  await ig.simulate.preLoginFlow().catch(() => null);

  if (!IG_USERNAME || !IG_PASSWORD)
    throw new Error(
      "`IG_USERNAME` or `IG_PASSWORD` must be set on `.env` file"
    );

  console.info(`> Authenticating into ${IG_USERNAME} account...`);
  let credentials: AccountRepositoryLoginResponseLogged_in_user;

  try {
    credentials = await ig.account.login(IG_USERNAME, IG_PASSWORD);
  } catch {
    console.info("> Failed to login, setting up Two Factor Authentication...");
    await ig.challenge.auto(true);
    Prompt.start();
    const { code } = await Prompt.get([
      { name: "code", description: "SMS code", required: true },
    ]);
    await ig.challenge.sendSecurityCode(code.toString());
    throw "> Two Factor Authentication settle up, now you can login again...";
  }
  const id = (username
    ? await ig.user.getIdByUsername(username)
    : credentials.pk
  )?.toString();
  const followersFeed = ig.feed.accountFollowers(id);
  const followingFeed = ig.feed.accountFollowing(id);

  console.info("> Getting followers/following concurrently...");
  const [followers, following] = await Promise.all([
    getAllItemsFromFeed<AccountFollowersFeedResponseUsersItem>(followersFeed),
    getAllItemsFromFeed<AccountFollowingFeedResponseUsersItem>(followingFeed),
  ]);

  console.info("> Making a new map of followers/following username...");
  const followerUsers = new Set(followers.map(({ username }) => username));
  const followingUsers = new Set(following.map(({ username }) => username));

  console.info("> Checking friendship...");
  const mutual = following.filter(({ username }) =>
    followerUsers.has(username)
  );
  const notFollowBackYou = following.filter(
    ({ username }) => !followerUsers.has(username)
  );
  const notGetYourFollowBack = followers.filter(
    ({ username }) => !followingUsers.has(username)
  );

  console.log(notFollowBackYou.map((i) => i?.username));

  console.log(
    "links to unfollow users\n",
    notFollowBackYou.map((i) => `instagram.com/${i?.username}`)
  );
  console.info("> Storing users into json file concurrently...");
  await Promise.all([
    storeJSON("./data/followers.json", followers),
    storeJSON("./data/following.json", following),
    storeJSON("./data/mutual.json", mutual),
    storeJSON("./data/not-follow-back-you.json", notFollowBackYou),
    storeJSON("./data/not-get-your-follow-back.json", notGetYourFollowBack),
  ]);
  console.info(`> Followers count: ${followers.length}`);
  console.info(`> Following count: ${following.length}`);
  console.info(`> Mutual count: ${mutual.length}`);
  console.info(`> Not follow back you count: ${notFollowBackYou.length}`);
  console.info(
    `> Not get your follow back count: ${notGetYourFollowBack.length}`
  );
  console.info("> Done!");

  // // Uncomment this code to automatically unfollow users who don't follow you back
  // console.log('> Enable unfollowing users who don\'t follow you back...');
  // unfollowUsers(ig, notFollowBackYou);
}
