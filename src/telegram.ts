import { TelegramConfig } from "./config";

export type NewChallengeData = {
  name: string;
  reasonGiven: string;
  pohProfileUrl: string;
  klerosCaseUrl: string;
};

export type StatusMessage = {
  id: number;
};

/**
 * Post a message to Telegram based on the configuration and message given.
 */
export const postMessage =
  (telegramConfig: TelegramConfig) =>
  async (challengeData: NewChallengeData): Promise<StatusMessage> => {
    const challengeMessage = makeMessage(challengeData);
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
 * Makes the string for the Telegram message.
 */
export const makeMessage = (data: NewChallengeData): string =>
  `⚖️ ${data.name} has been challenged.

📣「${data.reasonGiven}」

👤 View the profile: ${data.pohProfileUrl}

🔎 Follow the case: ${data.klerosCaseUrl}

#proofofhumanity`;
