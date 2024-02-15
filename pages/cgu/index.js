/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { signOut, useSession } from 'next-auth/react';
import Header from 'C/header';
import Footer from 'C/footer';
import { useEffect } from 'react';
import axiosInstance from "@/utils/axiosInstance";
import calculatePoints from '@/utils/calculatePoints';
import Head from 'next/head';

export default function CGU() {
    const { data: session, status } = useSession();
    const [points, setPoints] = React.useState(0);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }

        if (localStorage.getItem('points') != null) {
            setPoints(localStorage.getItem('points'))
        }

        if (localStorage.getItem('points') === null && localStorage.getItem('userOC') != null) {
            const user = JSON.parse(localStorage.getItem('userOC'));
            const calculatedPoints = calculatePoints(user);
            const totalPoints = calculatedPoints - user.pointsUsed;
            localStorage.setItem('points', totalPoints);
            setPoints(totalPoints);
        }

        if (localStorage.getItem('userOC') === null && session) {
            const getUser = async () => {
                try {
                    const response = await axiosInstance.get('/api/user', {
                        customConfig: { session: session }
                    });
                    const data = await response.data;
                    localStorage.setItem('userOC', JSON.stringify(data));
                    const calculatedPoints = calculatePoints(data);
                    const totalPoints = calculatedPoints - data.pointsUsed;
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                } catch (error) {
                    if (error.response.status === 401) {
                        setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                        setTimeout(() => {
                            signOut()
                            router.push('/');
                        }, 2000);
                    } else {
                        setError(error.response?.data?.message || error.message);
                    }
                }
            };
            getUser();
        }
    }, [status, session]);

    function HeadView() {
        return (
            <Head>
                <title>CGU - Owarida</title>
                <meta name="description" content="Conditions Générales d'Utilisation du site Owarida" />
                <meta name="keywords" content="owarida, cgu, conditions générales d'utilisation, twitch, hugo jacques" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
        )
    }

    if (status === 'loading') {
        return (
            <>
            <HeadView />
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
                </div>
                <Footer />
            </div>
            </>
        )
    }

    if (session) {
        return (
            <>
            <HeadView />
            <div className="flex flex-col min-h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="p-4 md:px-8 xl:px-12">
                    <h1 className='text-center font-bold text-2xl'>CONDITIONS GÉNÉRALES D'UTILISATION</h1>
                    <p className="text-center py-8">En vigueur au 11/01/2024</p>
                    <section>
                        <p>Les présentes conditions générales d'utilisation (dites <b>« CGU »</b>) ont pour objet l'encadrement juridique
                            des modalités de mise à disposition du site et des services et de définir les
                            conditions d’accès et d’utilisation des services par « l'Utilisateur ».</p>
                        <p>Les présentes CGU sont accessibles sur le site à la rubrique <b>«CGU»</b>.</p>
                        <p>Toute inscription ou utilisation du site implique l'acceptation sans aucune réserve ni restriction des
                            présentes CGU par l’utilisateur. Lors de l'inscription sur le site via le bouton de connexion par Twitch, chaque
                            utilisateur accepte expressément les présentes CGU ainsi que celle de Twitch
                            En cas de non-acceptation des CGU stipulées dans le présent contrat, l'Utilisateur se doit de
                            renoncer à l'accès des services proposés par le site.
                            owarida.fr se réserve le droit de modifier unilatéralement et à tout moment le contenu des présentes
                            CGU.
                        </p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 1 : Les mentions légales</h2>
                    <section>
                        <p>L’édition et la direction ainsi que la modification du site owarida.fr est assurée par JACQUES Hugo.</p>
                        <p> Adresse e-mail hugo.jacques71@gmail.com.</p>
                        <p> L'hébergeur du site owarida.fr est la société Vercel, dont le siège social est situé au Vercel Inc. 440 N
                            Barranca Ave #4133 Covina, CA 91723.
                        </p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 2 : Accès au site</h2>
                    <section>
                        <p>Le site owarida.fr permet à l'Utilisateur un accès gratuit aux services suivants :</p>
                        <p>Un système de collecte de points pour les viewers de la chaîne Twitch de Owarida, l'achat d'élément fictif avec les dit points, pouvoir visionner le stream.</p>
                        <p>Le site est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais
                            supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet,
                            etc.) sont à sa charge.</p>
                        <p>L’Utilisateur non membre n'a pas accès aux services réservés. Pour cela, il doit posséder un compte Twitch. En acceptant de s’inscrire sur Twitch l'utilisateur accepte leur CGU.</p>
                        <p>Toute désinscription ou suppression du compte Twitch de l'utilisateur entrainera une impossibilité d'accéder aux services d'owarida.fr.</p>
                        <p>Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement du site
                            ou serveur et sous réserve de toute interruption ou modification en cas de maintenance, n'engage
                            pas la responsabilité de owarida.fr. Dans ces cas, l’Utilisateur accepte ainsi ne pas tenir rigueur à
                            l’éditeur de toute interruption ou suspension de service, même sans préavis.</p>
                        <p>L'Utilisateur a la possibilité de contacter le site par messagerie électronique à l’adresse email de
                            l’éditeur communiqué à l’ARTICLE 1.</p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 3 : Collecte des données</h2>
                    <section>
                        <p>Le site assure à l'Utilisateur une collecte et un traitement d'informations personnelles dans le respect
                            de la vie privée conformément à la loi n°78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers
                            et aux libertés. Le site est déclaré à la CNIL sous le numéro 0000.</p>
                        <p>En vertu de la loi Informatique et Libertés, en date du 6 janvier 1978, l'Utilisateur dispose d'un droit
                            d'accès, de rectification, de suppression et d'opposition de ses données personnelles. L'Utilisateur
                            exerce ce droit :</p>
                        <p>· par mail à l'adresse email contact@owarida.fr</p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 4 : Propriété intellectuelle</h2>
                    <section>
                        <p>Les logos, images, signes ainsi que tout contenus représentant <b>Owarida</b> ou <b>Owarida.fr</b> ou encore <b>OwaCollect</b> sur le site font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur.</p>
                        <p>L'Utilisateur doit solliciter l'autorisation préalable du site pour toute reproduction, publication, copie
                            des différents contenus. Il s'engage à une utilisation des contenus du site dans un cadre strictement
                            privé, toute utilisation à des fins commerciales et publicitaires est strictement interdite.</p>
                        <p>Toute représentation totale ou partielle de ce site par quelque procédé que ce soit, sans l’autorisation
                            expresse de l’exploitant du site Internet constituerait une contrefaçon sanctionnée par l’article L 335-
                            2 et suivants du Code de la propriété intellectuelle.</p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 5 : Responsabilité</h2>
                    <section>
                        <p>Les sources des informations diffusées sur le site https://owarida.fr sont réputées fiables mais le site ne
                            garantit pas qu’il soit exempt de défauts, d’erreurs ou d’omissions.</p>
                        <p>Le site n'a à aucun moment accès au mot de passe Twitch de l'utilisateur, aussi le site décline toute responsabilité en cas de divulgation du mot de passe.</p>
                        <p>Les informations communiquées sont présentées à titre indicatif et général sans valeur contractuelle.
                            Malgré des mises à jour régulières, le site https://owarida.fr ne peut être tenu responsable de la modification
                            des dispositions administratives et juridiques survenant après la publication. De même, le site ne
                            peut être tenue responsable de l’utilisation et de l’interprétation de l’information contenue dans ce
                            site.</p>
                        <p>La responsabilité du site ne peut être engagée en cas de force majeure ou du fait imprévisible et
                            insurmontable d'un tiers.</p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 6 : Liens hypertextes</h2>
                    <section>
                        <p>Des liens hypertextes peuvent être présents sur le site. L’Utilisateur est informé qu’en cliquant sur ces
                            liens, il sortira du site https://owarida.fr. Ce dernier n’a pas de contrôle sur les pages web sur lesquelles
                            aboutissent ces liens et ne saurait, en aucun cas, être responsable de leur contenu.</p>
                    </section>
                    <h2 className="font-bold my-4">ARTICLE 7 : Cookies</h2>
                    <section>
                        <p>L’Utilisateur est informé que lors de ses visites sur le site, un cookie peut s’installer automatiquement
                            sur son logiciel de navigation.</p>
                        <p>Les cookies sont de petits fichiers stockés temporairement sur le disque dur de l’ordinateur de
                            l’Utilisateur par votre navigateur et qui sont nécessaires à l’utilisation du site owarida.fr. Les cookies
                            ne contiennent pas d’information personnelle et ne peuvent pas être utilisés pour identifier quelqu’un.
                            Un cookie contient un identifiant unique, généré aléatoirement et donc anonyme. Certains cookies
                            expirent à la fin de la visite de l’Utilisateur, d’autres restent.</p>
                        <p>L’information contenue dans les cookies est utilisée pour améliorer le site owarida.fr.</p>
                        <p>En naviguant sur le site, L’Utilisateur les accepte.</p>
                        <p>L’Utilisateur doit toutefois donner son consentement quant à l’utilisation de certains cookies.</p>
                        <p>A défaut d’acceptation, l’Utilisateur est informé que certaines fonctionnalités ou pages risquent de lui
                            être refusées.</p>
                        <p>L’Utilisateur pourra désactiver ces cookies par l’intermédiaire des paramètres figurant au sein de son
                            logiciel de navigation.</p>
                    </section>
                </div>
                <Footer />
            </div>
            </>
        )
    }

}