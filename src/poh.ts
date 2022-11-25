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

type EvidencesURI = Array<{
  URI: string;
}>;

type Submission = {
  name: string;
  requests: Array<{
    evidence: EvidencesURI;
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
  const evidenceDescription = await fetchEvidenceDescription(
    submission.requests[requestId].evidence
  );

  return {
    name: submission.name,
    challengeReason: evidenceDescription,
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

  // Fetch evidence description from the submission evidences URI
  async function fetchEvidenceDescription(submissionEvidences: EvidencesURI) {
    // TODO: Check the reason that there is no evidence on challenge event created.
    // Some submission doesn't have evidence data when the event is created.
    // If I check it again after a time, the evidence exists.
    // At the moment, if there is no evidence node, we set a default reason to review manually.
    let evidenceRegistration = submissionEvidences.find((evidence) =>
      evidence.URI.endsWith("evidence.json")
    );
    if (evidenceRegistration == undefined) {
      return "No evidence at the moment. Try to fetch it manually in a few seconds.";
    }
    const { evidence } = await fetchEvidence(evidenceRegistration.URI);
    return evidence.description;
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
