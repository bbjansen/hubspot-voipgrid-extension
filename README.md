# HubSpot VoIPGrid Extension
Call with VoIPGrid in HubSpot.


## Development

### Hubspot Enable Widget
```
// Add the following localstorage override for local development
localStorage.setItem(
  "LocalSettings:Sales:CallingExtensions",
  '{"name": "Voys", "url": "https://139.162.170.247:9025"}'
);
```