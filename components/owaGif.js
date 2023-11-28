import Image from "next/image";

export default function OwaGif() {
    return (
        <div className="relative w-auto h-60 content-center">
        <Image
            src="/images/owa.gif"
            alt="OWA"
            
            objectFit="contain"
            objectPosition="center"
            layout="fill"
        />
        </div>
    );
    }