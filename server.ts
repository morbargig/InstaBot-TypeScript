import { environment } from "./environment";
import {
  AccountFollowersFeedResponseUsersItem,
  AccountFollowingFeedResponseUsersItem,
  IgApiClient,
} from "instagram-private-api";
import { promisify } from "util"; // Import the promisify function
import { unfollowUsers } from "./unfollow-users";

// Use promisify to create a setTimeout function that returns a Promise
const wait = promisify(setTimeout);

async function fetchUsersByFeed(
  ig: IgApiClient,
  username: string,
  feedType: "followers" | "following",
  { delay, limit }: { delay?: number; limit?: any }
) {
  const id = await ig.user.getIdByUsername(username);
  const feed =
    feedType === "followers"
      ? await ig.feed.accountFollowers(id?.toString())
      : await ig.feed.accountFollowing(id?.toString());

  let users:
    | AccountFollowersFeedResponseUsersItem[]
    | AccountFollowingFeedResponseUsersItem[] = [];
  let reqId = 0;

  async function fetchPage() {
    try {
      console.log(`Fetching ${feedType}...`);
      reqId += 1;
      const items = await feed.items();
      users = [...users, ...items];

      if (limit && limit !== -1 && users.length >= limit) {
        console.log(`Limit reached. Finished fetching ${feedType}.`);
        return;
      }
    } catch (error) {
      console.error(`Error fetching ${feedType}:`, error);
      // You might want to handle the error here, e.g., retry or exit gracefully.
      return;
    }

    console.log("Waiting before the next request...");
    await wait((delay ?? 0) * 1000); // Use wait with milliseconds
    console.log("Finish Waiting...");
  }

  while (feed.isMoreAvailable()) {
    await fetchPage(); // Recursively fetch the next page
  }

  console.log(`No more ${feedType} available. Finished fetching ${feedType}.`);

  return users;
}

(async () => {
  // const ig = new IgApiClient();
  // ig.state.generateDevice(environment.IG_USERNAME);
  // if (environment.IG_PROXY) {
  //   ig.state.proxyUrl = environment.IG_PROXY;
  // }
  // try {
  //   await ig.simulate.preLoginFlow();
  //   const loggedInUser = await ig.account.login(
  //     environment.IG_USERNAME,
  //     environment.IG_PASSWORD
  //   );
  //   process.nextTick(async () => {
  //     try {
  //       await ig.simulate.postLoginFlow();
  //     } catch (error) {
  //       console.error("An error occurred during postLoginFlow:", error);
  //     }
  //   });
  //   // Fetch followers
  //   const followers = await fetchUsersByFeed(ig, "tlyrmh", "followers", {
  //     delay: 10,
  //     limit: -1, // Fetch all followers (no limit)
  //   });
  //   console.log("Total Followers:", followers.length);
  //   // Fetch following
  //   const following = await fetchUsersByFeed(ig, "tlyrmh", "following", {
  //     delay: 10,
  //     limit: -1, // Fetch all following (no limit)
  //   });
  //   console.log("Total Following:", following.length);
  // } catch (error) {
  //   console.error("An error occurred:", error);
  // }
  unfollowUsers(
    environment.testUser
    );
})();
