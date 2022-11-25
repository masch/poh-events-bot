import { ethers } from "ethers";
import { ProofOfHumanity__factory } from "../generated/poh-ethers-contracts/factories/ProofOfHumanity__factory";
import { AppConfig } from "../src/config";
import * as config from "../src/config";
import { Challenge, getChallengeInfo } from "./poh";
import * as telegram from "./telegram";

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

  const demoChallengeInfo = await fetchChallengeInfo();

  console.info("== Demo challenge telegram message ==");
  console.log(
    telegram.makeMessage(challengeInfoToTelegramMessageData(demoChallengeInfo))
  );

  if (configuration.serverConfig.sandboxConfig.postMessageToTelegram) {
    console.info("== Posting message on telegram ==");
    telegram
      .postMessage(configuration.telegramConfig)(
        challengeInfoToTelegramMessageData(demoChallengeInfo)
      )
      .then((data) => console.log("Message id created: " + data.id))
      .catch((error) => console.log("Could not send message: " + error));
  }

  poh.on(poh.filters.AddSubmission(), (_, __, event) => {
    console.info("Got submission add event:", event);
  });

  poh.on(poh.filters.SubmissionChallenged(), async (_, __, ___, event) => {
    console.info("Got submission challenge event:", event);
    const challengeInfo = await getChallengeInfo(
      event.args._submissionID,
      event.args._requestID.toNumber(),
      event.args._challengeID.toNumber()
    );
    console.info("Challenge info", challengeInfo);
    console.info(
      "Telegram message",
      telegram.makeMessage(challengeInfoToTelegramMessageData(challengeInfo))
    );
  });

  function challengeInfoToTelegramMessageData(
    challengeInfo: Challenge
  ): telegram.NewChallengeData {
    return {
      name: challengeInfo.name,
      reasonGiven: challengeInfo.challengeReason,
      pohProfileUrl: challengeInfo.pohProfileLink,
      klerosCaseUrl: challengeInfo.klerosCaseLink,
    };
  }

  async function fetchChallengeInfo(): Promise<Challenge> {
    console.info(
      "Geting challenge info: " +
        configuration.serverConfig.sandboxConfig.SubmissionIdToFetch.toLowerCase() +
        " ..."
    );
    if (!configuration.serverConfig.sandboxConfig.mockChallengeInfo) {
      return getChallengeInfo(
        configuration.serverConfig.sandboxConfig.SubmissionIdToFetch.toLowerCase(),
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
}

config.appConfigFromEnvironment().then(main).catch(console.error);
