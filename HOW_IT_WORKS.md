# How it works

## Listening to the event

The [PoH contract](https://github.com/Proof-Of-Humanity/Proof-Of-Humanity/blob/master/contracts/ProofOfHumanity.sol#L199)
has an event specifically for our use case.

```Solidity
event SubmissionChallenged(address indexed _submissionID, uint indexed _requestID, uint _challengeID);
```

We can take advantage of this with [ethers.js](https://github.com/ethers-io/ethers.js "ethers.js' GitHub")
which provides us with utilities to interact with the PoH contract.

[TypeChain](https://github.com/ethereum-ts/TypeChain)
can generate for us typings and helper functions based on the PoH contract ABI,
which we got from the [build script](https://github.com/Proof-Of-Humanity/Proof-Of-Humanity/blob/master/package.json#L19 "PoH build script")
in the [official PoH repository](https://github.com/Proof-Of-Humanity/Proof-Of-Humanity).

The ABI is stored in [assets/poh-contracts](assets/poh-contracts "ABI source folder") and the typings are generated with  
`typechain assets/poh-contracts/*.json --target ethers-v5 --out-dir generated/poh-ethers-contracts`.

Then, in the [code](https://github.com/masch/poh-events-bot/blob/main/src/start.ts#L21)
we can do the following, and ethers will start polling continuously,
calling our function when it detects a `SubmissionChallenged` event.

```typescript
poh.on(poh.filters.SubmissionChallenged(), async (_, __, ___, event) => {
  // handle event
}
```

`event.args` will have the type generated by TypeChain, something similar to:

```typescript
type SubmissionChallengedArgs = {
  _submissionID: string;
  _requestID: ethers.BigNumber;
  _challengeID: ethers.BigNumber;
};
```

- `_submissionID` will be the address of the wallet used to register the profile in [PoH](https://www.proofofhumanity.id "Proof of Humanity website")
- `_requestID` and `_challengeID` will help us find the reason for the challenge. It is worth noting that they are actually indexes and not IDs.

## Gathering the data for the Telegram message

The data included in the event payload is nowhere near what we need to make the message with the information we want,
but it does include de IDs to query the [PoH API](https://thegraph.com/explorer/subgraph/kleros/proof-of-humanity-mainnet "Proof of Humanity GraphQL playground").

```typescript
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
```

The indexes from the event are used to find the relevant request and challenge, and the evidence URI can be appended to
`https://ipfs.io` to make a GET request and get a JSON with the reason for the challenge.

For example, for [this message](https://t.me/PoHChallenges/113 "Example message") the evidence URI was `/ipfs/QmcaxH2XynK1D4A4b39q2jVeyGgKopc79hW52jKiDBG7hn/evidence.json`.

So we fetch the JSON from https://ipfs.io/ipfs/QmcaxH2XynK1D4A4b39q2jVeyGgKopc79hW52jKiDBG7hn/evidence.json

```json
{
  "name": "Challenge Justification",
  "description": "The submission guidelines section 2 reads: \"Face should not be covered under heavy make-up, large piercings or masks hindering the visibility of facial features\"\nand also that \n\"It cannot include special items worn only on special occasions that can, voluntarily or involuntarily, distract humans or algorithms from being able to detect identical faces.\"\nSection 4 reads: \"Lighting conditions and recording device quality should be sufficient to discern facial features and characters composing the Ethereum address displayed.\"\n\nSubmitter has what it looks like a bandage covering part of her nose both in photo and video, this clearly hinders the visibility of facial features which violates section 2.\nBoth picture and video are of poor quality, picture is grained and pixelated and the video lightning conditions are quite dark, such that the submitter has almost half of her face obscured by shadow which clearly violates section 4.\nSuch poor quality entries should not be accepted into the registry."
}
```

Now we have all the pieces to make the message, and for that we're using [this](https://core.telegram.org/bots/api#sendmessage)
library.
