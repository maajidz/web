import React from 'react';
import Link from 'next/link';
import { RiCheckLine } from 'react-icons/ri';

interface PricingCardProps {
  isPopular?: boolean;
  planName: string;
  price: string;
  pricePeriod: string;
  features: string[];
  buttonText: string;
  freePlanLink?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  isPopular,
  planName,
  price,
  pricePeriod,
  features,
  buttonText,
  freePlanLink
}) => {
  return (
    <div>
      <div className="card glass relative overflow-hidden">
        <div className="card-body">
          {isPopular && (
            <div className="badge badge-primary absolute top-0 right-0 font-medium rounded-bl-lg rounded-tr-none">
              Popular
            </div>
          )}
          <h3 className={`card-title text-xl ${isPopular ? 'mt-4' : ''} text-primary-content`}>{planName}</h3>
          <div className="flex items-end mb-4 text-primary-content">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-base-content/70 ml-1">{pricePeriod}</span>
          </div>
          <ul className="space-y-3 mb-6 text-base-content/90">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <RiCheckLine size={20} className="text-success mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary w-full">
            {buttonText}
          </button>
        </div>
      </div>
      {freePlanLink && (
        <div className="mt-4 text-center">
          <p className="text-sm text-base-content/70">
            Not ready to commit? Try our{" "}
            <Link href={freePlanLink} className="link link-primary">
              free basic plan
            </Link> with limited features.
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingCard; 