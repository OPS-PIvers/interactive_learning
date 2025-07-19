import Appsignal from "@appsignal/javascript";

const appsignal = new Appsignal({
  key: import.meta.env.VITE_APPSIGNAL_PUSH_API_KEY,
  namespace: "web",
  environment: import.meta.env.NODE_ENV || "development",
});

export default appsignal;