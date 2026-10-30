import axios from "axios";
import type { HttpOptions, Resp } from "../models/http.js";
import useOptions from "./useOptions.js";
import { ref } from "vue";
import { useToast, useOnline, useRefreshToken } from "#imports";

/**
 * const controller = new AbortController();

 * controller.abort();
 */

export const useHttp = async (
  url: string,
  options: HttpOptions = {}
): Promise<Resp> => {
  const toast = useToast();
  const isOnline = useOnline();
  try {
    if (!isOnline.value) {
      throw {
        response: {
          data: {
            Message: "No internet connection",
            StatusCode: 1001,
          },
        },
      };
    }

    // if (!options?.isGlobal) {
    //   await useRefreshToken();
    // }
    const httpConfig = useOptions(url, options);

    if (!httpConfig) return { data: ref(null), error: ref(true) };

    const method = (httpConfig.options?.method ?? "get")
      .trim()
      .toLocaleLowerCase();
    const body =
      method != "get"
        ? { data: httpConfig.options?.data }
        : { params: httpConfig.options?.data };

    const response = await axios({  
      ...{
        url: httpConfig.url,
        signal: options.signal,
        headers: httpConfig.options?.headers,
        method: method,
      },
      ...body,
    });

    if (response?.data && options?.alertSuccess) {
      toast.add({
        title: "Success",
        description: "Request was successful",
        type: "success",
        color: "green",
      });
    }
    if (
      options?.alertSuccess != null &&
      typeof options?.alertSuccess == "object"
    ) {
      alertToast(
        options?.alertSuccess.title ?? "Success",
        options?.alertSuccess.description ?? "Request was successful",
        options?.alertSuccess.type ?? "success",
        options?.alertSuccess.color ?? "green"
      );
    } else if (options?.alertSuccess)
      alertToast("Success", "Request was successful", "success", "green");

    return { data: ref(response?.data), error: ref(null) };
  } catch (e: any) {
    if (options?.alertError != null && typeof options?.alertError == "object") {
      alertToast(
        options?.alertError.title ?? "Error",
        options?.alertError.description ??
          e.response?.data.Message ??
          "An error occurred",
        options?.alertError.type ?? "danger",
        options?.alertError.color ?? "red"
      );
    } else if (options?.alertError)
      alertToast(
        "Error",
        e.response?.data.Message ?? "An error occurred",
        "danger",
        "red"
      );
    return { data: ref(null), error: ref(e.response?.data) };
  }

  function alertToast(
    title: string,
    description: string,
    type: string,
    color: string
  ) {
    toast.add({
      title: title,
      description: description,
      type: type,
      color: color,
    });
  }
};
