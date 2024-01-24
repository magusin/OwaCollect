import crypto from 'crypto';
import { getToken } from "next-auth/jwt";

// Fonction pour vérifier la signature
export default async function verifySignature(req) {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!signature || !timestamp) {
        return false;
    }

    // Obtenir le token
    const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!nextToken) {
        return false;
    }

    // Reconstruire la chaîne à signer
    const stringToSign = `${nextToken}.${timestamp}`;

    // Générer la signature attendue
    const expectedSignature = crypto.createHmac('sha256', process.env.SECRET_SIGNATURE).update(stringToSign).digest('hex');

    return signature === expectedSignature;
}