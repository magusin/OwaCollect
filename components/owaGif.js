import Image from "next/image";

export default function OwaGif() {
    return (
        <div className="relative w-auto h-52 content-center">
        <Image
            src="/images/owa.gif"
            alt="OWA"
            layout="fill"
            objectFit="contain"
            objectPosition="center"
        />
        </div>
    );
    }