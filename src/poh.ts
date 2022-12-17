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

export type RemoveSubmission = {
  name: string;
  reason: string;
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

type PohSubmission = {
  data: {
    submission: Submission;
  };
};

export const getChallengeInfo = async (
  submissionId: string,
  requestId: number,
  challengeId: number
) => {
  const { pohSubmission, evidenceDescription } = await fetchPohSubmission(
    submissionId,
    requestId
  );

  return {
    name: pohSubmission.data.submission.name,
    challengeReason: evidenceDescription,
    pohProfileLink: `${pohProfile_BASEURL}${submissionId.toLowerCase()}`,
    klerosCaseLink: `${klerosCase_BASEURL}${pohSubmission.data.submission.requests[requestId].challenges[challengeId].disputeID}`,
  };
};

export const getRemoveSubmissionInfo = async (
  submissionId: string,
  requestId: number
) => {
  const { pohSubmission, evidenceDescription } = await fetchPohSubmission(
    submissionId,
    requestId
  );

  return {
    name: pohSubmission.data.submission.name,
    reason: evidenceDescription,
    pohProfileLink: `${pohProfile_BASEURL}${submissionId.toLowerCase()}`,
  };
};

// -- HELPERS

async function fetchPohSubmission(submissionId: string, requestId: number) {
  await new Promise((r) => setTimeout(r, 1000 * 50));
  const pohSubmission = await fetchSubmission(submissionId);
  console.info(
    "fetchPohSubmission - data: ",
    util.inspect(pohSubmission.data, { showHidden: false, depth: null })
  );
  console.info(
    "fetchPohSubmission - data.submission: ",
    util.inspect(pohSubmission.data.submission, {
      showHidden: false,
      depth: null,
    })
  );
  const submission = pohSubmission.data.submission;
  console.info(
    "fetchPohSubmission - submission.requests: ",
    util.inspect(submission.requests, {
      showHidden: false,
      depth: null,
    })
  );
  console.info(
    "fetchPohSubmission - request id: ",
    util.inspect(requestId, {
      showHidden: false,
      depth: null,
    })
  );
  console.info(
    "fetchPohSubmission - request: ",
    util.inspect(submission.requests[requestId].evidence, {
      showHidden: false,
      depth: null,
    })
  );
  const submissionEvidences = submission.requests[requestId].evidence;
  const evidenceDescription = await fetchEvidenceDescription(
    submissionEvidences
  );

  return {
    pohSubmission: pohSubmission,
    evidenceDescription: evidenceDescription,
  };
}

// Fetch submision from POH
async function fetchSubmission(submissionId: string) {
  const POHResponse = await fetch(pohApi_URL, {
    method: "POST",
    body: JSON.stringify({ query: infoQuery(submissionId) }),
  });

  const POHChallenge: PohSubmission = await POHResponse.json();
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
  console.info(
    "Fetching registration: ",
    util.inspect(evidenceRegistration.URI, { showHidden: false, depth: null })
  );
  const evidence = await fetchEvidence(evidenceRegistration.URI);
  if (evidence == undefined) {
    return "Error getting evidence description";
  }
  return evidence.description;
}

// Fetch challenge evidence from IPFS
async function fetchEvidence(evidenceURI: String) {
  let responseText = "";
  return await fetch(`${ipfs_BASEURL}${evidenceURI}`)
    .then((response) => {
      return response.text();
    })
    .then((data) => {
      responseText = data;
      console.info(
        "Fetching evidence IPFS text response: ",
        util.inspect(responseText, { showHidden: false, depth: null })
      );
      const evidence: Evidence = JSON.parse(responseText);
      return evidence;
    })
    .catch((error) => {
      console.log(
        "Could parse evidence: " + responseText + " - error: " + error
      );
    });
}

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
