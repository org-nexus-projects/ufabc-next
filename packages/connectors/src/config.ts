type ConnectorServiceConfig = {
  baseURL: string;
  requesterKey?: string;
};

type ConnectorsConfig = {
  ufabcParser: ConnectorServiceConfig;
};

const config: ConnectorsConfig = {
  ufabcParser: { baseURL: '', requesterKey: '' },
};

export function configureConnectors(overrides: Partial<ConnectorsConfig>) {
  if (overrides.ufabcParser) {
    config.ufabcParser = { ...config.ufabcParser, ...overrides.ufabcParser };
  }
}

export function getConnectorConfig(service: keyof ConnectorsConfig): ConnectorServiceConfig {
  return config[service];
}
