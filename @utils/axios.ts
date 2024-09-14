import axiosHttpsFix, {
  AxiosError,
  AxiosRequestConfig,
} from 'axios-https-proxy-fix';
import { sleep } from './sleep';

export type Proxy = {
  host: string;
  port: string;
  username?: string;
  password?: string;
};

/**
 * Выполняет безопасный HTTP-запрос с помощью axios с опциональным прокси
 * @param config Конфигурация запроса Axios
 * @returns Промис, который разрешается данными ответа или объектом ошибки
 */
export const axiosSafeRequest = async <T = any>(
  config: Omit<AxiosRequestConfig, 'proxy'> & {
    proxy?: Proxy;
  },
): Promise<
  | { ok: T }
  | {
      error: 'unknown' | '429-many-request' | '404-not-found';
      message?: string;
    }
> => {
  try {
    const data = await axios<T>(config);
    return { ok: data };
  } catch (error) {
    // Проверяем, является ли ошибка axios ошибкой
    if ('response' in error && error.response) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 429) {
        return {
          error: '429-many-request',
        } as const;
      }
      if (axiosError.response?.status === 404) {
        return {
          error: '404-not-found',
        } as const;
      }
    }

    return {
      error: 'unknown',
      message: error.message,
    } as const;
  }
};

export const axiosSafeRequestRepetter = async <T = any>(
  config: Omit<AxiosRequestConfig, 'proxy'> & {
    proxy?: Proxy;
  },
  tryessec: number[],
) => {
  for (const sec of tryessec) {
    const result = await axiosSafeRequest<T>(config);
    if ('ok' in result) {
      return result;
    }

    if (result.error === '429-many-request') {
      await sleep(sec);
      continue;
    }

    return result;
  }

  return { error: '429-many-request' as const };
};

export const axios = async <T = any>(
  config: Omit<AxiosRequestConfig, 'proxy'> & {
    proxy?: Proxy;
  },
) => {
  const { proxy, ...params } = config;

  const axiosParams: AxiosRequestConfig = {
    ...params,
    proxy: proxy && {
      host: proxy.host,
      port: +proxy.port,
      auth: proxy.username &&
        proxy.password && {
          username: proxy.username,
          password: proxy.password,
        },
    },
  };

  const response = await axiosHttpsFix(axiosParams);
  return response.data as T;
};
