import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";

export default function Duel({ errorServer, duelInfo}) {
    const { data: session, status } = useSession();
    

}

export async function getServerSideProps(context) {
    const { id } = context.params;

    const session = await getServerSession(
        context?.req,
        context?.res,
        nextAuthOptions
    );

    if (!session) {
        return {
            props: { errorServer: 'Session expirée reconnectez-vous' },
        };
    }

    try {
        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/duel/${id}`, {
            headers: {
                Authorization: `Bearer ${session.customJwt}`,
            },
        });
        const duelInfo = await response.data;
        console.log(duelInfo)
        return {
            props: { duelInfo },
        };
        } catch (error) {
            if (error.response.status === 401) {
                return {
                    props: { errorServer: 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' },
                };
            }
    
            return {
                props: { errorServer: error.message },
            }; 
    }
}
