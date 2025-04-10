import React from 'react';

interface CtaCardProps {
  title: string;
  description: string;
  buttonText: string;
  finePrint?: string;
}

const CtaCard: React.FC<CtaCardProps> = ({ title, description, buttonText, finePrint }) => {
  return (
    <div className="card glass text-center">
      <div className="card-body">
        <h2 className="card-title justify-center mb-3 text-primary-content">{title}</h2>
        <p className="text-base-content/80 text-sm mb-5">{description}</p>
        <button className="btn btn-primary w-full">
          {buttonText}
        </button>
        {finePrint && <p className="mt-4 text-xs text-base-content/50">{finePrint}</p>}
      </div>
    </div>
  );
};

export default CtaCard; 