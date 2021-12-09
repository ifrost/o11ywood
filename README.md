# Grafana o11ywood data source plugin

## Description

o11ywood is a Grafana plugin to visualize and analyze movie screenplays:

![Script Pulse](https://github.com/ifrost/o11ywood/blob/main/gfx/script-pulse.png?raw=true)
![Script Pulse](https://github.com/ifrost/o11ywood/blob/main/gfx/conversations.png?raw=true)
![Script Pulse](https://github.com/ifrost/o11ywood/blob/main/gfx/dialogue-orchiestration.png?raw=true)
![Script Pulse](https://github.com/ifrost/o11ywood/blob/main/gfx/dialogue-time.png?raw=true)
![Script Pulse](https://github.com/ifrost/o11ywood/blob/main/gfx/timeline.png?raw=true)

## Getting started

A data source backend plugin consists of both frontend and backend components.

### Frontend

1. Install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode

   ```bash
   yarn build
   ```

### Backend

1. Update [Grafana plugin SDK for Go](https://grafana.com/docs/grafana/latest/developers/plugins/backend/grafana-plugin-sdk-for-go/) dependency to the latest minor version:

   ```bash
   go get -u github.com/grafana/grafana-plugin-sdk-go
   go mod tidy
   ```

2. Build backend plugin binaries for Linux, Windows and Darwin:

   ```bash
   mage -v
   ```

3. List all available Mage targets for additional commands:

   ```bash
   mage -l
   ```

## Learn more

- [Build a data source backend plugin tutorial](https://grafana.com/tutorials/build-a-data-source-backend-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System
- [Grafana plugin SDK for Go](https://grafana.com/docs/grafana/latest/developers/plugins/backend/grafana-plugin-sdk-for-go/)
