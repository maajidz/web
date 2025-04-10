import React from 'react';
import Image from 'next/image';
import { RiStarFill, RiStarHalfFill } from 'react-icons/ri';

interface TestimonialCardProps {
  name: string;
  imageUrl: string;
  rating: number; // e.g., 4.5 or 5
  text: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex text-yellow-400 text-xs">
      {[...Array(fullStars)].map((_, i) => <RiStarFill key={`full-${i}`} />)}
      {hasHalfStar && <RiStarHalfFill key="half" />}
      {[...Array(emptyStars)].map((_, i) => <i key={`empty-${i}`} className="ri-star-line" /> /* Assuming ri-star-line is available or use alternative */)}
    </div>
  );
};

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, imageUrl, rating, text }) => {
  return (
    <div className="card card-compact glass">
      <div className="card-body">
        <div className="flex items-center mb-4">
          <div className="avatar mr-3">
            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
              <Image src={imageUrl} alt={name} width={40} height={40} className="object-cover" />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-primary-content">{name}</h4>
            <StarRating rating={rating} />
          </div>
        </div>
        <p className="text-base-content/80 text-sm italic">{`"${text}"`}</p>
      </div>
    </div>
  );
};

export default TestimonialCard; 