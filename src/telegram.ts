import { TelegramConfig } from "./config";

export type NewChallengeData = {
  name: string;
  reasonGiven: string;
  pohProfileUrl: string;
  klerosCaseUrl: string;
};

export type NewRemoveSubmissionData = {
  name: string;
  reason: string;
  pohProfileUrl: string;
};

export type StatusMessage = {
  id: number;
};

/**
 * Post a New Challenge message to Telegram based on the configuration and message given.
 */
export const postMessageNewChallengeRequested =
  (telegramConfig: TelegramConfig) =>
  async (challengeData: NewChallengeData): Promise<StatusMessage> => {
    const message = makeChallengeMessage(challengeData);
    return postMessage(telegramConfig)(message);
  };

/**
 * Post a Remove submission message to Telegram based on the configuration and message given.
 */
export const postMessageRemoveSubmission =
  (telegramConfig: TelegramConfig) =>
  async (
    removeSubmissionData: NewRemoveSubmissionData
  ): Promise<StatusMessage> => {
    const message = makeRemoveSubmissionMessage(removeSubmissionData);
    return postMessage(telegramConfig)(message);
  };

/**
 * Post a message to Telegram based on the configuration and message given.
 */
const postMessage =
  (telegramConfig: TelegramConfig) =>
  async (challengeMessage: string): Promise<StatusMessage> => {
    const url = `https://api.telegram.org/bot${
      telegramConfig.apiKey
    }/sendMessage?chat_id=${telegramConfig.chatId}&text=${encodeURIComponent(
      challengeMessage
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      return Promise.reject(new Error(response.statusText));
    }

    type JSONResponse = {
      ok: boolean;
      result: {
        message_id: number;
      };
    };
    const tgResponse: JSONResponse = await response.json();
    return {
      id: tgResponse.result.message_id,
    };
  };

/**
 * Makes the string for the Telegram challenge message event.
 */
export const makeChallengeMessage = (data: NewChallengeData): string =>
  `⚖️ ${data.name} has been challenged.

📣「${data.reasonGiven}」

👤 View the profile: ${data.pohProfileUrl}

🔎 Follow the case: ${data.klerosCaseUrl}

#challengeRequested`;

/**
 * Makes the string for the Telegram remove submission message event.
 */
export const makeRemoveSubmissionMessage = (
  data: NewRemoveSubmissionData
): string =>
  `☠️ ${data.name} has been removed.

📣「${data.reason}」

👤 View the profile: ${data.pohProfileUrl}

#removeSubmission`;
