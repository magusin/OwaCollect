import Image from "next/legacy/image";

export default function OwaGif() {
    return (
        <div className="relative w-full h-1/2 content-center">
        <Image
            src="/images/owa.png"
            alt="Owarida collect"
            priority={true}
            objectFit="contain"
            objectPosition="center"
            layout="fill"        
        />
        </div>
    );
}