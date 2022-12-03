import * as config from "./config";
import { AppConfig } from "./config";
import { ethers } from "ethers";
import { ProofOfHumanity__factory } from "../generated/poh-ethers-contracts";
import { getChallengeInfo, getRemoveSubmissionInfo } from "./poh";
import {
  challengeToTelegramMessageData,
  removeSubmissionToTelegramMessageData,
} from "./tranformer";
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
      console.info("Challenge info: ", challengeInfo);

      const tgMessageData = challengeToTelegramMessageData(challengeInfo);
      const messageResult = await telegram.postMessageNewChallengeRequested(
        configuration.telegramConfig
      )(tgMessageData);

      console.info(
        "Message challenged requested id created: ",
        messageResult.id
      );
    } catch (err) {
      console.error(err);
    }
  });

  poh.on(poh.filters.RemoveSubmission(), async (_, __, ___, event) => {
    try {
      console.info("Got remove submission event:", event.args);
      const removeSubmission = await getRemoveSubmissionInfo(
        event.args._submissionID,
        event.args._requestID.toNumber()
      );
      console.info("Remove submission info: ", removeSubmission);

      const tgMessageData =
        removeSubmissionToTelegramMessageData(removeSubmission);
      const messageResult = await telegram.postMessageRemoveSubmission(
        configuration.telegramConfig
      )(tgMessageData);

      console.info("Message remove submission id created: ", messageResult.id);
    } catch (err) {
      console.error(err);
    }
  });

  console.info(
    `Messages will be posted on ${configuration.telegramConfig.chatId} channel.\nStarting server on ${configuration.serverConfig.port} PORT...\n`
  );

  express()
    .get("/ping", (_, res) => res.send("pong"))
    .listen(configuration.serverConfig.port);
};

config.appConfigFromEnvironment().then(main).catch(console.error);
