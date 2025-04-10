import React from 'react';

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
}

const Section: React.FC<SectionProps> = ({ id, className, children, title }) => {
  return (
    <section id={id} className={`py-8 px-4 ${className || ''}`}>
      {title && <h2 className="text-2xl font-bold text-center mb-8 text-primary-content">{title}</h2>}
      <div className="max-w-xs mx-auto">
        {children}
      </div>
    </section>
  );
};

export default Section; 