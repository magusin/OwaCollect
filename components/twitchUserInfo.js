import React from 'react';
import Image from "next/legacy/image";

const TwitchUserInfo = ({ userData }) => {
    return (
        <div className="flex flex-col max-w-md mx-auto my-auto rounded overflow-hidden shadow-lg justify-around" style={{ height: '50vh' }}>
            <div className="text-center py-2">
                <span className="font-bold md:text-xl xl:text-3xl inline-block rounded px-4 py-1 bg-white">{userData.name}</span>
            </div>
            <div className='flex flex-row items-center'>
                <div className="w-1/2 h-full relative">
                    <Image
                        className='rounded-full'
                        layout="fill"
                        objectFit="cover"
                        src={userData.imageUrl}
                        alt={`${userData.name} profile`}
                        priority={true}
                    />
                </div>
                <div className="w-1/2 px-6 py-4 flex flex-col justify-between">
                    <div className="px-6 py-4">
                        <span className="text-lg inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-red-700 mr-2 mb-2 whitespace-nowrap">Subs: {userData.subs}</span>
                        <span className="text-lg inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-red-700 mr-2 mb-2 whitespace-nowrap">Messages: {userData.messages}</span>
                        <span className="text-lg inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-red-700 mr-2 mb-2 whitespace-nowrap">Gifts: {userData.gifts}</span>
                        <span className="text-lg inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-red-700 mr-2 mb-2 whitespace-nowrap">Bits: {userData.bits}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TwitchUserInfo;