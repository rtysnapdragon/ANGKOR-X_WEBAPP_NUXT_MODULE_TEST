import type { Ref, AbortController, AbortSignal } from "#imports";

export interface HttpOptions {
  data?: object;
  body?: FormData | object;
  method?: string;
  headers?: object;
  isGlobal?: boolean;
  isWeb?: boolean;
  alertError?: any;
  alertSuccess?: any;
  signal?: AbortSignal;
  cancelToken?: any;
}


export interface Resp {
  data?: Ref;
  error?: Ref;
}

export interface HeaderResult {
  url: string;
  options: HttpOptions;
}
