interface GetHostParams {
  purpose?: string;
}

export const getHost = ({ purpose }: GetHostParams = {}): string => {
  if (typeof window !== 'undefined') {
    const { host, hostname } = window.location;
    const apiUrlInLocalStorage = localStorage.getItem("GPTR_API_URL");
    const envApiUrl =
      process.env.NEXT_PUBLIC_GPTR_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.REACT_APP_GPTR_API_URL;

    const urlParams = new URLSearchParams(window.location.search);
    const apiUrlInUrlParams = urlParams.get("GPTR_API_URL");
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0';

    if (apiUrlInLocalStorage) {
      return apiUrlInLocalStorage;
    } else if (apiUrlInUrlParams) {
      return apiUrlInUrlParams;
    } else if (envApiUrl) {
      return envApiUrl;
    } else if (purpose === 'langgraph-gui') {
      return isLocalHost ? 'http%3A%2F%2F127.0.0.1%3A8123' : `https://${host}`;
    } else {
      return isLocalHost ? 'http://localhost:8000' : `https://${host}`;
    }
  }
  return '';
};
