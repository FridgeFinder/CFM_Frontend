<p align="center">
  <a href="https://fridgefinder.app/">
    <img src="https://raw.githubusercontent.com/FridgeFinder/CFM_Frontend/dev/public/feedback/happyFridge.svg" height="128">
  </a>
  <h1 align="center">Fridge Finder</h1>
</p>

<p align="center">
  <a aria-label="GitHub Repo stars" href="https://github.com/FridgeFinder/CFM_Frontend/">
    <img alt="" src="https://img.shields.io/github/stars/FridgeFinder/CFM_Frontend?style=flat-square&labelColor=F6F6F6">
  </a>
  <img aria-label="GitHub contributors" alt="GitHub contributors" src="https://img.shields.io/github/contributors/FridgeFinder/CFM_Frontend?style=flat-square&labelColor=F6F6F6">
  <img alt="Build Status" src="https://img.shields.io/github/actions/workflow/status/FridgeFinder/CFM_Frontend/dev.yaml?style=flat-square&labelColor=F6F6F6">
  <a aria-label="Frontend channel on Discord" href="https://discord.com/channels/955884900655972463/955886184159125534">
    <img alt="" src="https://img.shields.io/badge/Join%20the%20community-yellow.svg?style=flat-square&logo=Discord&labelColor=F6F6F6">
  </a>
</p>

A community fridge is a decentralized resource where businesses and individuals can [donate perishable food](https://www.thrillist.com/lifestyle/new-york/nyc-community-fridges-how-to-support). There are dozens of fridges hosted by volunteers across the country. The Fridge Finder website is available at [fridgefinder.app](https://fridgefinder.app/)

Fridge Finder is based out of Brooklyn, New York. Our goal is to make it easy for people to find fridge locations and get involved with food donation programs in their community. We are building a responsive, mobile first, web application with administrative tools for fridge maintainers. To join the project read our [contributing guidelines](./CONTRIBUTING.md) and [code of conduct](./CODE_OF_CONDUCT.md). The software architecture is documented in the [programmer reference](./architecture-reference.md) document.

<h2>Made possible by contributions from these lovely people &hellip;</h2>
<p align="center">
  <a href = "https://github.com/FridgeFinder/CFM_Frontend/graphs/contributors">
    <img src = "https://contrib.rocks/image?repo=FridgeFinder/CFM_Frontend"/>
  </a>
</p>
<h3 align="right">❤ Thank you for all your hard work</h3>

## System Requirements

1. [Node](https://nodejs.org/en/)
1. [Firebase CLI](https://firebase.google.com/docs/cli) (required for the auth emulator)

## System Setup

1. Verify your system meets the requirements

   ```bash
   node --version  # must be >= 22.20.0
   ```

1. Install global dependencies

   ```bash
   npm install --global yarn svgo lint-staged concurrently
   corepack enable # for yarn
   ```

1. Setup the frontend environment

   ```bash
   git clone https://github.com/FridgeFinder/CFM_Frontend frontend
   cd frontend
   git checkout dev
   yarn install
   ```

1. Run the unit tests

   ```bash
   yarn test
   ```

1. Start the Firebase Auth emulator

   Auth sign-in is routed to the local Firebase emulator by default — no credentials are needed. Start the emulator before launching the app:

   ```bash
   yarn emulators
   ```

1. Run the application locally

   In a new terminal window:

   ```bash
   # to run both development database and the web server
   yarn dev

   # to run only the web server on port 3000
   yarn web

   # to run only the database server on port 3050
   yarn data
   ```

   in a different terminal window

   ```bash
   start   "Google Chrome" http://localhost:3000/ # Windows
   open -a "Google Chrome" http://localhost:3000/ # MacOS
   ```

1. Connect to the real Firebase project (optional)

   If you need to test against real Firebase Auth, create a `.env.local` file in the project root and ask a team member for the credentials for `FridgeFinder-Dev`:

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false
   NEXT_PUBLIC_USERS_API_URL=https://users-api-dev.communityfridgefinder.com
   NEXT_PUBLIC_NOTIFICATIONS_API_URL=https://notifications-api-dev.communityfridgefinder.com
   ```
