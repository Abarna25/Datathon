# Fix for White Screen Error

## Changes Made
- Restored `homepage: "/app/"` in `package.json` to ensure proper relative asset generation during production and local builds.
- Removed the broken SPA catch-all rule and Static Assets rule from `catalyst-user-rules.json`. The local Catalyst emulator's API gateway was incorrectly catching requests for the `bundle.js` static assets and literally returning `index.html` instead of the JavaScript code.

## Why this fixes the issue
By removing the rule, Catalyst naturally passes all `/app/` requests to the `zcatalyst-cli-plugin-react` dev server. The React Webpack dev server *already* has a built-in `historyApiFallback` that handles SPA routing, meaning we don't need the local API Gateway to perform the redirect. 

## Verification Results
- I ran the server and successfully fetched `http://127.0.0.1:3000/app/static/js/bundle.js`. 
- Previously, this returned HTML. It now correctly returns the Webpack JavaScript bundle, meaning the browser will successfully execute the React app and remove the white screen.
