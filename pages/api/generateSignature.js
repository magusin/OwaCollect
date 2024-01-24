import crypto from 'crypto';
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        const timeStamp = req.body.timestamp;
        if (!timeStamp) {
            return res.status(401).json({ message: 'Timestamp non fourni' });
        }
        const stringToSign = `${nextToken}.${timeStamp}`;
        const secretKey = process.env.SECRET_SIGNATURE;
        const signature = crypto.createHmac('sha256', secretKey).update(stringToSign).digest('hex');
        res.status(200).json({ signature });
    } catch (err) {
        onError(err, res)
    }
}