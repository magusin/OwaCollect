import axios from 'axios';

// Créer une instance Axios
const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Ajouter un intercepteur de requête
axiosInstance.interceptors.request.use(async (config) => {
    // Ajouter la logique pour générer le timestamp et la signature ici
    const timestamp = new Date().getTime().toString();
    const signatureResponse = await axios.post(`/api/generateSignature`, { timestamp: timestamp });

    config.headers['x-timestamp'] = timestamp;
    config.headers['x-signature'] = signatureResponse.data.signature;

   // Ajouter le JWT de la session s'il est présent dans la configuration de la requête
   if (config.customConfig && config.customConfig.session) {
    config.headers['Authorization'] = `Bearer ${config.customConfig.session.customJwt}`;
}
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosInstance;