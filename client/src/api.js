import axios from "axios";

const api = axios.create({
  baseURL: "https://golf-charity-backend-2xd5.onrender.com/api",
});

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
  }
}

const token = localStorage.getItem("token");
if (token) setToken(token);

export default api;
