# POH Challenge Bot

A [telegram bot](https://t.me/PoHChallenges2) sends a Telegram message on multiples POH contract events.
At this time, the following events are implemented:

- Challenges: Each time a profile is challenged by the members of [Proof of Humanity](https://www.proofofhumanity.id/) (POH). It displays the name of the profile being challenged, a link to the profile in POH and a link to the case in the [Kleros](https://kleros.io/) court.


![Screenshot from 2022-11-19 23-38-43](https://user-images.githubusercontent.com/53308354/202880216-61577193-abf7-4199-8384-4742294f0c96.png)


Feel free to open an issue with any suggestions.

## Check out how it works

[How it works](https://github.com/masch/poh-events-bot/blob/main/HOW_IT_WORKS.md)

## Acknowledgements

Thanks to [poh-challenge-bot](https://github.com/tomasellis/poh-challenge-bot) for examples on how to connect to the POH contract.

## Run Locally

Clone the project

```bash
  git clone https://github.com/masch/poh-events-bot
```

Go to the project directory

```bash
  cd poh-events-bot
```

Install dependencies

```bash
  npm install
```

Compile contracts

```bash
  npm run generate
```

Run the sandbox

```bash
  npm run sandbox
```
