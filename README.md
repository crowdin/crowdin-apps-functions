[<p align='center'><img src='https://support.crowdin.com/assets/logos/crowdin-dark-symbol.png' data-canonical-src='https://support.crowdin.com/assets/logos/crowdin-dark-symbol.png' width='200' height='200' align='center'/></p>](https://crowdin.com)

# Crowdin Apps Functions library

Lightweight library with utility functions to help you quickly create your own Crowdin App.

Information about Crowdin App can be found in the [About Crowdin Apps](https://support.crowdin.com/crowdin-apps/) and in the [Getting Started Guide](https://support.crowdin.com/crowdin-apps-introduction/).

## Status

[![npm](https://img.shields.io/npm/v/@crowdin/crowdin-apps-functions?logo=npm&cacheSeconds=1800)](https://www.npmjs.com/package/@crowdin/crowdin-apps-functions)
[![npm](https://img.shields.io/npm/dt/@crowdin/crowdin-apps-functions?cacheSeconds=1800)](https://www.npmjs.com/package/@crowdin/crowdin-apps-functions)
[![GitHub issues](https://img.shields.io/github/issues/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/issues)
[![License](https://img.shields.io/github/license/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/blob/master/LICENSE)

[![codecov](https://codecov.io/gh/crowdin/crowdin-apps-functions/branch/main/graph/badge.svg)](https://codecov.io/gh/crowdin/crowdin-apps-functions)
[![GitHub Release Date](https://img.shields.io/github/release-date/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/graphs/contributors)

## Build Status

| Azure CI (Linux) | Azure CI (Windows) | Azure CI (MacOS) |
|--------------------|------------------|------------------|
|[![Build Status](https://dev.azure.com/crowdin/crowdin-apps-functions/_apis/build/status/Ubuntu?branchName=main)](https://dev.azure.com/crowdin/crowdin-apps-functions/_build/latest?definitionId=35&branchName=main)|[![Build Status](https://dev.azure.com/crowdin/crowdin-apps-functions/_apis/build/status/Windows?branchName=main)](https://dev.azure.com/crowdin/crowdin-apps-functions/_build/latest?definitionId=37&branchName=main)|[![Build Status](https://dev.azure.com/crowdin/crowdin-apps-functions/_apis/build/status/MacOS?branchName=main)](https://dev.azure.com/crowdin/crowdin-apps-functions/_build/latest?definitionId=36&branchName=main)
|[![Azure DevOps tests (branch)](https://img.shields.io/azure-devops/tests/crowdin/crowdin-apps-functions/35/main?cacheSeconds=1800)](https://dev.azure.com/crowdin/crowdin-apps-functions/_build/latest?definitionId=35&branchName=main)|[![Azure DevOps tests (branch)](https://img.shields.io/azure-devops/tests/crowdin/crowdin-apps-functions/37/main?cacheSeconds=1800)](https://dev.azure.com/crowdin/crowdin-apps-functions/_build/latest?definitionId=37&branchName=main)|[![Azure DevOps tests (branch)](https://img.shields.io/azure-devops/tests/crowdin/crowdin-apps-functions/36/main?cacheSeconds=1800)](https://dev.azure.com/crowdin/crowdin-apps-functions/_build/latest?definitionId=36&branchName=main)

## Table of Contents
* [Installation](#installation)
* [Quick Start](#quick-start)
* [Contributing](#contributing)
* [Seeking Assistance](#seeking-assistance)
* [License](#license)

## Installation

### npm
  `npm i @crowdin/crowdin-apps-functions`

### yarn
  `yarn add @crowdin/crowdin-apps-functions`

## Quick Start

<details>
<summary>Typescript</summary>

```typescript
import { generateOAuthToken } from '@crowdin/crowdin-apps-functions';

generateOAuthToken('app_client_id', 'app_client_secret', 'code_from_install_event');
```

</details>

<details>
<summary>Javascript ES6 modules</summary>

```javascript
import { generateOAuthToken } from '@crowdin/crowdin-apps-functions';

generateOAuthToken('app_client_id', 'app_client_secret', 'code_from_install_event');
```

</details>

<details>
<summary>Javascript CommonJS</summary>

```javascript
const crowdinFunctions = require('@crowdin/crowdin-apps-functions');

crowdinFunctions.generateOAuthToken('app_client_id', 'app_client_secret', 'code_from_install_event');
```

</details>

### Functions summary

Mainly all functions are intended to help you quickly develop your app but they also can reduce some work when you are integrating with Crowdin API.
Please refer to JSDoc for more details.

| Method name                        | Description                                                    |
|------------------------------------|----------------------------------------------------------------|
| `generateOAuthToken`               | generates OAuth token for communication with Crowdin API       |
| `refreshOAuthToken`                | refresh OAuth token in case if it was expired                  |
| `constructCrowdinIdFromJwtPayload` | creates unique id of crowdin user and project from the context |
| `validateJwtToken`                 | validates if jwt token for your app is valid                   |
| `updateOrCreateFile`               | create or update file in Crowdin                               |
| `getFolder`                        | get folder with and files under it                             |
| `getOrCreateFolder`                | get folder with files under it or create it                    |

Also please have a look to working example of the [Crowdin App](https://github.com/crowdin/create-crowdin-app). It can be used as a basis for your app.

## Contributing
If you want to contribute please read the [Contributing](/CONTRIBUTING.md) guidelines.

## Seeking Assistance
If you find any problems or would like to suggest a feature, please feel free to file an issue on Github at [Issues Page](https://github.com/crowdin/crowdin-apps-functions/issues).

If you've found an error in these samples, please [Contact Customer Success Service](https://crowdin.com/contacts).

## License
<pre>
The Crowdin Apps Functions library is licensed under the MIT License. 
See the LICENSE.md file distributed with this work for additional 
information regarding copyright ownership.

Except as contained in the LICENSE file, the name(s) of the above copyright
holders shall not be used in advertising or otherwise to promote the sale,
use or other dealings in this Software without prior written authorization.
</pre>
