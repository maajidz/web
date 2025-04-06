import React from 'react';
import Link from 'next/link';
import {
  RiHome5Fill,
  RiSearchLine,
  RiUserAddFill,
  RiChat1Line,
  RiUserLine
} from 'react-icons/ri';

const TabBar = () => {
  // Determine active state based on current route (implementation depends on router)
  const activeClass = 'text-primary';
  const inactiveClass = 'text-base-content/60';

  return (
    <div className="dock md:hidden fixed bottom-0 w-full backdrop-blur-lg z-50 h-16">
      <Link href="/" className={activeClass}>
        <RiHome5Fill size={24} />
      </Link>
      <Link href="/explore" className={inactiveClass}>
        <RiSearchLine size={24} />
      </Link>
      <button className="relative -mt-1">
         <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
           <div className="w-14 h-14 flex items-center justify-center bg-primary/80 backdrop-blur-md rounded-full shadow-lg border border-base-content/10">
              <RiUserAddFill size={28} className="text-primary-content" />
           </div>
         </div>
      </button>
      <Link href="/messages" className={inactiveClass}>
        <RiChat1Line size={24} />
      </Link>
      <Link href="/profile" className={inactiveClass}>
        <RiUserLine size={24} />
      </Link>
    </div>
  );
};

export default TabBar; 