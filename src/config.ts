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

export const appConfigFromEnvironment = (): Promise<AppConfig> =>
  Promise.resolve({
    serverConfig: {
      port: parseInt(process.env["PORT"] ?? "5000"),
      mockChallengeInfo: process.env["MOCK_CHALLENGE_INFO"] === "true",
    },
    infuraConfig: {
      url: process.env["INFURA_URL"] as string,
    },
    telegramConfig: {
      apiKey: process.env["TG_API_KEY"] as string,
      chatId: process.env["TG_CHAT_ID"] ?? defaultPOHChallengesTelegramChatId,
    },
  });

const defaultPOHChallengesTelegramChatId = "@PoHChallenges2";
export const pohContractAddress = "0xC5E9dDebb09Cd64DfaCab4011A0D5cEDaf7c9BDb";
export const pohApi_URL =
  "https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-mainnet";
export const klerosCase_BASEURL = "https://resolve.kleros.io/cases/";
export const pohProfile_BASEURL = "https://app.proofofhumanity.id/profile/";
export const ipfs_BASEURL = "https://ipfs.io/";
