import { ethers } from "ethers";
import { ProofOfHumanity__factory } from "../generated/poh-ethers-contracts/factories/ProofOfHumanity__factory";
import { AppConfig } from "../src/config";
import * as config from "../src/config";
import {
  Challenge,
  getChallengeInfo,
  getRemoveSubmissionInfo,
  RemoveSubmission,
} from "./poh";
import * as telegram from "./telegram";
import {
  challengeToTelegramMessageData,
  removeSubmissionToTelegramMessageData,
} from "./tranformer";

async function main(configuration: AppConfig) {
  console.info("== Starting with configuration :", configuration);

  const provider = new ethers.providers.JsonRpcProvider(
    configuration.infuraConfig.url
  );
  provider.pollingInterval = 60 * 1000;

  const poh = ProofOfHumanity__factory.connect(
    config.pohContractAddress,
    provider
  );

  poh.on(poh.filters.AddSubmission(), (_, __, event) => {
    console.info("Got submission add event:", event);
  });

  poh.on(poh.filters.SubmissionChallenged(), async (_, __, ___, event) => {
    console.info("Got submission challenged event:", event);
    const challengeInfo = await getChallengeInfo(
      event.args._submissionID,
      event.args._requestID.toNumber(),
      event.args._challengeID.toNumber()
    );
    console.info("Challenge info", challengeInfo);
    console.info(
      "Telegram challenged message",
      telegram.makeChallengeMessage(
        challengeToTelegramMessageData(challengeInfo)
      )
    );
  });

  poh.on(poh.filters.RemoveSubmission(), async (_, __, ___, event) => {
    console.info("Got remove submission event:", event);
    const removeSubmission = await getRemoveSubmissionInfo(
      event.args._submissionID,
      event.args._requestID.toNumber()
    );
    console.info("Remove submission info: ", removeSubmission);
    console.info(
      "Telegram challenged message",
      telegram.makeRemoveSubmissionMessage(
        removeSubmissionToTelegramMessageData(removeSubmission)
      )
    );
  });

  console.log(await fetchRemoveSubmissionsInfoFromBlockChain());
  console.log(await fetchSubmissionsChallangeInfoFromBlockChain());

  const demoRemoveSubmission = await fetchRemoveSubmission();
  console.info("== Demo remove submission telegram message ==");
  console.log(
    telegram.makeRemoveSubmissionMessage(
      removeSubmissionToTelegramMessageData(demoRemoveSubmission)
    )
  );

  const demoChallengeInfo = await fetchChallengeInfo();
  console.info("== Demo challenge telegram message ==");
  console.log(
    telegram.makeChallengeMessage(
      challengeToTelegramMessageData(demoChallengeInfo)
    )
  );

  if (configuration.serverConfig.sandboxConfig.postMessageToTelegram) {
    console.info("== Posting message on telegram ==");
    telegram
      .postMessageNewChallengeRequested(configuration.telegramConfig)(
        challengeToTelegramMessageData(demoChallengeInfo)
      )
      .then((data) => console.log("Message challenged id created: " + data.id))
      .catch((error) => console.log("Could not send message: " + error));

    telegram
      .postMessageRemoveSubmission(configuration.telegramConfig)(
        removeSubmissionToTelegramMessageData(demoRemoveSubmission)
      )
      .then((data) => console.log("Message removed id created: " + data.id))
      .catch((error) => console.log("Could not send message: " + error));
  }

  async function fetchRemoveSubmission(): Promise<RemoveSubmission> {
    if (!configuration.serverConfig.sandboxConfig.mockChallengeInfo) {
      console.info(
        "Geting remove submission info: " +
          configuration.serverConfig.sandboxConfig.removedSubmissionIdToFetch.toLowerCase() +
          " ..."
      );
      return getRemoveSubmissionInfo(
        configuration.serverConfig.sandboxConfig.removedSubmissionIdToFetch.toLowerCase(),
        1
      );
    } else {
      return {
        name: "Gus",
        reason:
          "Test = Over the past months, someone in control of the account 0x0a32cfcb355d1a0c8e5f73cf33627806a841fc1e received a total of ~250k UBI from 123 addresses registered in PoH. Someone's controlling all these 123 accounts and this is one of them. Please see attached",
        pohProfileLink:
          "https://app.proofofhumanity.id/profile/0xf8fd6890836e2051112b749a9f981b0827050a47",
      };
    }
  }

  async function fetchChallengeInfo(): Promise<Challenge> {
    if (!configuration.serverConfig.sandboxConfig.mockChallengeInfo) {
      console.info(
        "Geting challenge info: " +
          configuration.serverConfig.sandboxConfig.challengedSubmissionIdToFetch.toLowerCase() +
          " ..."
      );
      return getChallengeInfo(
        configuration.serverConfig.sandboxConfig.challengedSubmissionIdToFetch.toLowerCase(),
        0,
        0
      );
    } else {
      return {
        name: "Paula",
        challengeReason:
          '"The video quality should be at least 360p..." This video is 352 x 640, which is less than 360p. As set precedent by cases 674 and 673, size does matter!',
        pohProfileLink:
          "https://app.proofofhumanity.id/profile/0xf8fd6890836e2051112b749a9f981b0827050a47",
        klerosCaseLink: `https://resolve.kleros.io/cases/755`,
      };
    }
  }

  async function fetchSubmissionsChallangeInfoFromBlockChain(): Promise<
    Challenge[]
  > {
    console.info("== Demo challenged submissions info from blockchain ==");

    const filterFrom = poh.filters.SubmissionChallenged(null, null, null);
    const challengeseEvengsFromChain = await poh.queryFilter(
      filterFrom,
      13689500,
      13689510
    );

    const challengesInfo = challengeseEvengsFromChain.map((challengeInfo) =>
      getChallengeInfo(
        challengeInfo.args._submissionID,
        challengeInfo.args._requestID.toNumber(),
        challengeInfo.args._challengeID.toNumber()
      )
    );

    return Promise.all(challengesInfo);
  }

  async function fetchRemoveSubmissionsInfoFromBlockChain(): Promise<
    RemoveSubmission[]
  > {
    console.info("== Demo remove submissions info from blockchain ==");

    const filterFrom = poh.filters.RemoveSubmission(null, null, null);
    const removeSubmissionsEventsFromChain = await poh.queryFilter(
      filterFrom,
      13686919,
      13686919
    );

    const removeSubsmissionsInfo = removeSubmissionsEventsFromChain.map(
      (challengeInfo) =>
        getRemoveSubmissionInfo(challengeInfo.args._submissionID, 1)
    );

    return Promise.all(removeSubsmissionsInfo);
  }
}

config.appConfigFromEnvironment().then(main).catch(console.error);
