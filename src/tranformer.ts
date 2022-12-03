import { Challenge, RemoveSubmission } from "./poh";
import * as telegram from "./telegram";

export const challengeToTelegramMessageData = (challengeInfo: Challenge) => {
  const tgMessageData: telegram.NewChallengeData = {
    name: challengeInfo.name,
    reasonGiven: challengeInfo.challengeReason,
    pohProfileUrl: challengeInfo.pohProfileLink,
    klerosCaseUrl: challengeInfo.klerosCaseLink,
  };
  return tgMessageData;
};

export const removeSubmissionToTelegramMessageData = (
  removeSubmission: RemoveSubmission
) => {
  const tgMessageData: telegram.NewRemoveSubmissionData = {
    name: removeSubmission.name,
    reason: removeSubmission.reason,
    pohProfileUrl: removeSubmission.pohProfileLink,
  };
  return tgMessageData;
};
