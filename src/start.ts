import * as config from "./config";
import { AppConfig } from "./config";
import { ethers } from "ethers";
import { ProofOfHumanity__factory } from "../generated/poh-ethers-contracts";
import { Challenge, getChallengeInfo } from "./poh";
import * as telegram from "./telegram";
import express from "express";

// -- RUN

const main = (configuration: AppConfig) => {
  const provider = new ethers.providers.JsonRpcProvider(
    configuration.infuraConfig.url
  );
  provider.pollingInterval = 60 * 1000;
  const poh = ProofOfHumanity__factory.connect(
    config.pohContractAddress,
    provider
  );

  provider.on("poll", (pollNumber, blockNumber) =>
    console.info(`Poll ${pollNumber}: block ${blockNumber}`)
  );

  poh.on(poh.filters.SubmissionChallenged(), async (_, __, ___, event) => {
    try {
      console.info("Got submission challenge event:", event.args);
      const challengeInfo = await getChallengeInfo(
        event.args._submissionID,
        event.args._requestID.toNumber(),
        event.args._challengeID.toNumber()
      );

      const tgMessageData = infoToTelegramMessageData(challengeInfo);

      console.info("Challenge info: ", challengeInfo);

      const messageResult = await telegram.postMessage(
        configuration.telegramConfig
      )(tgMessageData);
      console.info("Message id created: ", messageResult.id);
    } catch (err) {
      console.error(err);
    }
  });

  express()
    .get("/ping", (_, res) => res.send("pong"))
    .listen(configuration.serverConfig.port);
};

config.appConfigFromEnvironment().then(main).catch(console.error);

// -- HELPERS

const infoToTelegramMessageData = (challengeInfo: Challenge) => {
  const tgMessageData: telegram.NewChallengeData = {
    name: challengeInfo.name,
    reasonGiven: challengeInfo.challengeReason,
    pohProfileUrl: challengeInfo.pohProfileLink,
    klerosCaseUrl: challengeInfo.klerosCaseLink,
  };
  return tgMessageData;
};
