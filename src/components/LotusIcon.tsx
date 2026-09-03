import type { SVGProps } from 'react';

export function LotusIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center petal */}
      <path d="M12 3.5 C 10.5 6, 10.5 9.5, 12 11.5 C 13.5 9.5, 13.5 6, 12 3.5 Z" />
      {/* Left inner petal */}
      <path d="M12 11.5 C 9 10, 7 7.5, 6.5 5 C 9 5.5, 11 8, 12 11.5 Z" />
      {/* Right inner petal */}
      <path d="M12 11.5 C 15 10, 17 7.5, 17.5 5 C 15 5.5, 13 8, 12 11.5 Z" />
      {/* Left outer petal */}
      <path d="M12 12 C 8 12.5, 4.5 11, 2.5 8 C 5.5 8.5, 9 9.5, 12 12 Z" />
      {/* Right outer petal */}
      <path d="M12 12 C 16 12.5, 19.5 11, 21.5 8 C 18.5 8.5, 15 9.5, 12 12 Z" />
      {/* Base / water line */}
      <path d="M4 16.5 C 8 15.5, 16 15.5, 20 16.5" />
      <path d="M6 19 C 9 18, 15 18, 18 19" />
    </svg>
  );
}
