[<p align='center'><img src='https://support.crowdin.com/assets/logos/crowdin-dark-symbol.png' data-canonical-src='https://support.crowdin.com/assets/logos/crowdin-dark-symbol.png' width='200' height='200' align='center'/></p>](https://crowdin.com)

# Crowdin Apps Functions library

Lightweight library with utility functions to help you quickly create your own Crowdin App.

Information about Crowdin Apps can be found in the [About Crowdin Apps](https://developer.crowdin.com/crowdin-apps-about/) and in the [Quick Start](https://developer.crowdin.com/crowdin-apps-quick-start/) guide.

<div align="center">

[![npm](https://img.shields.io/npm/v/@crowdin/crowdin-apps-functions?logo=npm&cacheSeconds=1800)](https://www.npmjs.com/package/@crowdin/crowdin-apps-functions)
[![npm](https://img.shields.io/npm/dt/@crowdin/crowdin-apps-functions?cacheSeconds=1800)](https://www.npmjs.com/package/@crowdin/crowdin-apps-functions)
[![CI](https://github.com/crowdin/crowdin-apps-functions/actions/workflows/basic.yml/badge.svg)](https://github.com/crowdin/crowdin-apps-functions/actions/workflows/basic.yml)
[![codecov](https://codecov.io/gh/crowdin/crowdin-apps-functions/branch/main/graph/badge.svg)](https://codecov.io/gh/crowdin/crowdin-apps-functions)
[![GitHub Release Date](https://img.shields.io/github/release-date/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/graphs/contributors)
[![License](https://img.shields.io/github/license/crowdin/crowdin-apps-functions?cacheSeconds=3600)](https://github.com/crowdin/crowdin-apps-functions/blob/master/LICENSE)

</div>

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

| Method name                        | Description                                                     |
|------------------------------------|-----------------------------------------------------------------|
| `fetchAppToken`                    | fetch API token for communication with Crowdin API              |
| `generateOAuthToken`               | generates OAuth token for communication with Crowdin API        |
| `refreshOAuthToken`                | refresh OAuth token in case if it was expired                   |
| `constructCrowdinIdFromJwtPayload` | creates unique id of crowdin user and project from the context  |
| `getProjectId`                     | extracts project id from crowdin id                             |
| `validateJwtToken`                 | validates if jwt token for your app is valid                    |
| `updateOrCreateFile`               | create or update file in Crowdin                                |
| `getFolder`                        | get folder with and files under it                              |
| `getOrCreateFolder`                | get folder with files under it or create it                     |
| `uploadTranslations`               | adds file to storage and sends it in upload translation request |
| `updateSourceFiles`                | updates source files under specific directory                   |
| `handleTranslations`               | executes side effect function for each translated file          |
| `getSubscription`                  | returns an information about app subscription                   |

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
