/* tslint:disable:no-console */
/*
  This is an example of unfollowing users who aren't following you back.
  Thanks to the developers for this great package.
 */
import { Feed, IgApiClient } from "instagram-private-api";
import { getUser } from "./helpers/get-user";

export const unfollowUsers = (username?: string) => {
  const ig = new IgApiClient();
  const user = getUser("miryam_bargig");
  ig.state.generateDevice(user?.username);

  (async () => {
    await ig.account.login(user?.username, user?.password);
    const id = username
      ? await ig.user.getIdByUsername(username)
      : ig.state.cookieUserId;
    console.log(`leggin user ${ig.state.cookieUsername}`);
    console.log(
      `Target user to get users that don't follow back ${
        username ?? ig.state.cookieUsername
      }`
    );
    const followersFeed = ig.feed.accountFollowers(id);
    const followingFeed = ig.feed.accountFollowing(id);

    const followers = await getAllItemsFromFeed(followersFeed);
    const following = await getAllItemsFromFeed(followingFeed);

    console.log(`${username ?? "You"} have ${followers.length} followers`);
    console.log(
      `${username ?? "You are"}  following ${following.length} users`
    );

    // Making a new map of users username that follow you.
    const followersUsername = new Set(followers.map((i) => i?.username));
    // Filtering through the ones who aren't following you.
    const notFollowingYou = following.filter(
      ({ username }) => !followersUsername.has(username)
    );
    // notFollowingYou
    console.log(`${notFollowingYou.length} users are not following you back`);

    console.log(notFollowingYou.map((i) => i?.username));

    console.log(
      "links to unfollow users\n",
      notFollowingYou.map((i) => `instagram.com/${i?.username}`)
    );
    // Looping through and unfollowing each user
    return;
    for (const user of notFollowingYou) {
      await ig.friendship.destroy(user.pk);
      console.log(`unfollowed ${user.username}`);
      /*
          Time, is the delay which is between 1 second and 7 seconds.
          Creating a promise to stop the loop to avoid api spam
       */
      const time = Math.round(Math.random() * 60000) + 1000;
      console.log(`Waiting ${time}ms`);
      await new Promise((resolve) => setTimeout(resolve, time));
      console.log("Finished waiting");
    }
  })();

  /**
   * Source: https://github.com/dilame/instagram-private-api/issues/969#issuecomment-551436680
   * @param feed
   * @returns All items from the feed
   */

  async function getAllItemsFromFeed<T>(feed: Feed<any, T>): Promise<T[]> {
    let items: T[] = [];
    do {
      items = items.concat(await feed.items());
    } while (feed.isMoreAvailable());
    return items;
  }
};
