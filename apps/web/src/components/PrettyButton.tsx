import React from 'react';

interface PrettyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary'; // Add other variants later if needed
  // Add any other specific props if necessary
}

const PrettyButton: React.FC<PrettyButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  ...props
}) => {

  // Base styles + variant combined
  let buttonClasses = [
    "inline-flex items-center justify-center", // Layout
    "px-6 py-3", // Padding - Adjust if needed
    "rounded-full", // Shape
    "font-semibold text-white", // Text
    "transition duration-200 ease-in-out hover:opacity-90", // Interaction
    "focus:outline-none focus:ring-2 focus:ring-offset-2", // Focus
    className, // Allow external classes
  ];

  if (variant === 'primary') {
    buttonClasses = [
      ...buttonClasses,
      // Adjusted Gradient: Mimic subtle top highlight and main color
      "bg-gradient-to-b from-[rgb(105,73,231)] to-[rgb(85,50,226)]", 
      // Adjusted Shadow: Match the purple glow effect
      "shadow-[0_4px_18px_rgba(89,56,255,0.45)]", 
      "focus:ring-[rgb(138, 116, 228)]", // Focus ring color
    ];
  }
  // Add other variants later if needed

  return (
    <button className={buttonClasses.filter(Boolean).join(' ')} {...props}>
      {/* No extra divs needed - styles applied directly to the button */}
      {children}
    </button>
  );
};

export default PrettyButton;