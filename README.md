## GhostComponents

- GhostComponents it's NodeJS CLI that can help you to find all React Components non-used in your app Tree Components.

## Support

- Project created by create-react-app or any from scratch configuration.
- We don't support projects that use different syntax for importing components, like NextJS. we working on that for the next release/patches.

## Installation

```
  npm install -g ghostcomponents
```

## How to use it

- if your entry point does not contain ReactDOM.render(), use -rc ROOT_COMPONENT_NAME as option to the CLI

```properties
  foo@bar:~$ ghostcomponents -r YOUR_ROOT_PROJECT -e PATH_ENTRY_POINT
  foo@bar:~$ ghostcomponents -r YOUR_ROOT_PROJECT -e PATH_ENTRY_POINT -rc ROOT_COMPONENT_NAME
```
