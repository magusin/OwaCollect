import React from "react";
import { useEffect } from "react";
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios'
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import { useDarkMode } from "@/contexts/darkModeContext";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";
import Head from 'next/head';

export default function Scribe({ user }) {
    const { data: session } = useSession();
    const router = useRouter();
    const { darkMode } = useDarkMode();
    const points = calculatePoints(user);
    useEffect(() => {
        if (!session) {
            router.push('/login');
        }
    }, [session, router]);
}