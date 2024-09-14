export type ProxyServersServiceContract = {
  getRandomProxyServer(region?: 'ua' | 'ru' | 'ro'): Promise<{
    host: string;
    port: string;
    username: string;
    password: string;
  }>;
};
