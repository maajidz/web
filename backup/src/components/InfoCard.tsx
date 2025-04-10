import React from 'react';

interface InfoCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  iconBgClass?: string; // e.g., bg-primary/20
  iconTextClass?: string; // e.g., text-primary
  align?: 'center' | 'left';
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  description,
  iconBgClass = 'bg-primary/20',
  iconTextClass = 'text-primary',
  align = 'center'
}) => {
  const alignmentClasses = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  const iconMargin = align === 'center' ? 'mx-auto mb-4' : 'mr-3 mb-0';
  const iconContainerSize = align === 'center' ? 'w-12 h-12' : 'w-10 h-10';
  const textAlignment = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="card card-compact glass">
      <div className="card-body">
        <div className={`flex ${alignmentClasses} ${align === 'left' ? 'mb-4' : 'flex-col'}`}>
          <div className={`flex items-center justify-center ${iconContainerSize} ${iconBgClass} rounded-full ${iconMargin} ${iconTextClass}`}>
            {React.cloneElement(icon, { size: align === 'center' ? 24 : 20 } as any)}
          </div>
          <div className={align === 'left' ? 'flex-grow' : 'w-full'}>
            <h3 className={`card-title text-lg ${textAlignment} ${align === 'center' ? 'mb-2' : ''} text-primary-content`}>{title}</h3>
            {align === 'left' && <p className={`text-base-content/80 ${textAlignment} text-sm`}>{description}</p>}
          </div>
        </div>
        {align === 'center' && <p className={`text-base-content/80 ${textAlignment} text-sm`}>{description}</p>}
      </div>
    </div>
  );
};

export default InfoCard; 