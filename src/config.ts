export type AppConfig = {
  serverConfig: ServerConfig;
  infuraConfig: InfuraConfig;
  telegramConfig: TelegramConfig;
};

export type ServerConfig = {
  port: number;
  mockChallengeInfo: boolean;
};

export type InfuraConfig = {
  url: string;
};

export type TelegramConfig = {
  apiKey: string;
  chatId: string;
};

export const appConfigFromEnvironment = (): Promise<AppConfig> => {
  const config: AppConfig = {
    serverConfig: {
      port: parseInt(process.env["PORT"] ?? "5000"),
      mockChallengeInfo: process.env["MOCK_CHALLENGE_INFO"] === "true",
    },
    infuraConfig: {
      url: (process.env["INFURA_URL"] as string) ?? "",
    },
    telegramConfig: {
      apiKey: (process.env["TELEGRAM_API_KEY"] as string) ?? "",
      chatId:
        process.env["TELEGRAM_CHAT_ID"] ?? defaultPOHChallengesTelegramChatId,
    },
  };

  if (config.infuraConfig.url === "") {
    return Promise.reject(
      new Error("INFURA_URL environment variable must be configured")
    );
  }

  if (config.telegramConfig.apiKey === "") {
    return Promise.reject(
      new Error("TELEGRAM_API_KEY environment variable must be configured")
    );
  }

  return Promise.resolve(config);
};

const defaultPOHChallengesTelegramChatId = "@PoHChallenges2";
export const pohContractAddress = "0xC5E9dDebb09Cd64DfaCab4011A0D5cEDaf7c9BDb";
export const pohApi_URL =
  "https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-mainnet";
export const klerosCase_BASEURL = "https://resolve.kleros.io/cases/";
export const pohProfile_BASEURL = "https://app.proofofhumanity.id/profile/";
export const ipfs_BASEURL = "https://ipfs.io/";
