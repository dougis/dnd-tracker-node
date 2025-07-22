import axios from 'axios';

const ApiService = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default ApiService;
