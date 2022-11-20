import {
  pohApi_URL,
  pohProfile_BASEURL,
  klerosCase_BASEURL,
  ipfs_BASEURL,
} from "./config";
import * as util from "util";

export type Challenge = {
  name: string;
  challengeReason: string;
  klerosCaseLink: string;
  pohProfileLink: string;
};

type Evidence = {
  name: string;
  description: string;
};

type Submission = {
  name: string;
  requests: Array<{
    evidence: Array<{
      URI: string;
    }>;
    challenges: Array<{
      disputeID: string;
    }>;
  }>;
};

type PohChallenge = {
  data: {
    submission: Submission;
  };
};

export const getChallengeInfo = async (
  submissionId: string,
  requestId: number,
  challengeId: number
) => {
  await new Promise((r) => setTimeout(r, 1000 * 50));

  const challenge = await fetchChallenge();

  const submission = challenge.data.submission;
  const evidenceURI = submission.requests[requestId].evidence[1].URI;
  const { evidence } = await fetchEvidence(evidenceURI);

  return {
    name: submission.name,
    challengeReason: evidence.description,
    pohProfileLink: `${pohProfile_BASEURL}${submissionId.toLowerCase()}`,
    klerosCaseLink: `${klerosCase_BASEURL}${submission.requests[requestId].challenges[challengeId].disputeID}`,
  };

  // Fetch challenge from POH
  async function fetchChallenge() {
    const POHResponse = await fetch(pohApi_URL, {
      method: "POST",
      body: JSON.stringify({ query: infoQuery(submissionId) }),
    });

    const POHChallenge: PohChallenge = await POHResponse.json();
    console.info(
      "Response from PoH API: ",
      util.inspect(POHChallenge, { showHidden: false, depth: null })
    );
    return POHChallenge;
  }

  // Fetch challenge evidence from IPFS
  async function fetchEvidence(evidenceURI: String) {
    const IPFSResponse = await fetch(`${ipfs_BASEURL}${evidenceURI}`);
    const evidence: Evidence = await IPFSResponse.json();
    console.info(
      "Response evidence from IPFS API: ",
      util.inspect(evidence, { showHidden: false, depth: null })
    );
    return { evidence };
  }
};

// -- HELPERS

const infoQuery = (submissionId: string) => `
    query {
        submission(id: "${submissionId.toLowerCase()}") {
            name
            requests(orderBy: creationTime, orderDirection: asc) {
              type
              evidence(orderBy:creationTime, orderDirection: asc) {
                URI
              }
              challenges {
                reason
                challengeID
                disputeID
              }
            }
        }
    }`;
