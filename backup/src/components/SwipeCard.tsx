import React from 'react';
import Image from 'next/image';
import {
  RiMoneyPoundCircleLine,
  RiCalendarLine,
  RiCloseLine,
  RiInformationLine,
  RiHeartLine,
} from 'react-icons/ri';

interface SwipeCardProps {
  profile: {
    name: string;
    age: number;
    role: string;
    location: string;
    imageUrl: string;
    budget: string;
    moveInDate: string;
    tags: string[];
  };
  style?: React.CSSProperties; // For stack positioning
  className?: string; // For swipe effects
}

const SwipeCard: React.FC<SwipeCardProps> = ({ profile, style, className }) => {
  return (
    <div
      className={`card shadow-xl rounded-xl overflow-hidden backdrop-blur-md absolute w-full h-full top-0 left-0 transition-transform duration-300 ease-in-out ${className}`}
      style={style}
    >
      <figure className="relative h-48 w-full">
        <Image
          src={profile.imageUrl}
          alt={`${profile.name}'s profile`}
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 className="card-title text-lg text-primary-content">{`${profile.name}, ${profile.age}`}</h3>
          <p className="text-base-content/80 text-sm">{`${profile.role} • ${profile.location}`}</p>
        </div>
      </figure>
      <div className="card-body p-4">
        <div className="flex justify-between mb-3 text-sm text-base-content/80">
          <div className="flex items-center">
            <RiMoneyPoundCircleLine className="mr-2" size={20} />
            <span>{profile.budget}</span>
          </div>
          <div className="flex items-center">
            <RiCalendarLine className="mr-2" size={20} />
            <span>{profile.moveInDate}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.tags.map((tag) => (
            <span key={tag} className="badge badge-outline badge-sm cursor-default">{tag}</span>
          ))}
        </div>
        <div className="card-actions justify-center space-x-4">
          <button className="btn btn-circle btn-outline glass border-red-400/50 hover:bg-red-400/20 hover:border-red-400">
            <RiCloseLine size={24} className="text-red-400" />
          </button>
          <button className="btn btn-circle btn-outline glass border-blue-400/50 hover:bg-blue-400/20 hover:border-blue-400">
            <RiInformationLine size={24} className="text-blue-400" />
          </button>
          <button className="btn btn-circle btn-outline glass border-green-400/50 hover:bg-green-400/20 hover:border-green-400">
            <RiHeartLine size={24} className="text-green-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard; 