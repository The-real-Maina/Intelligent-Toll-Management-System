import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("itms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("itms_token");
      localStorage.removeItem("itms_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export { API };
export default API;

// ================= VEHICLES =================

export const getVehicles = () => API.get("/vehicles");

export const createVehicle = (vehicle) =>
  API.post("/vehicles", vehicle);

export const updateVehicle = (id, vehicle) =>
  API.put(`/vehicles/${id}`, vehicle);

export const deleteVehicle = (id) =>
  API.delete(`/vehicles/${id}`);

// ================= TOLL GATES =================

export const getTollGates = () =>
  API.get("/tollgates");

export const createTollGate = (gate) =>
  API.post("/tollgates", gate);

export const updateTollGate = (id, gate) =>
  API.put(`/tollgates/${id}`, gate);

export const deleteTollGate = (id) =>
  API.delete(`/tollgates/${id}`);