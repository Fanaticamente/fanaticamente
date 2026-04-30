import type { SVGProps } from "react";

const SetorSaudeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Setor Saúde"
    {...props}
  >
    <path
      d="M28 224V65.5L42.5 32h61L118 88h103c8.8 0 16 7.2 16 16s-7.2 16-16 16h-86.5l70.6 70.6c6.2 6.2 6.2 16.4 0 22.6s-16.4 6.2-22.6 0L118 148.7V224H28Z"
      fill="currentColor"
    />
    <path d="M50 52h38v16H50V52Z" fill="Canvas" fillOpacity="0.96" />
    <path d="M48 92h58v32H48V92Z" fill="Canvas" fillOpacity="0.96" />
    <path d="M48 137h58v66H48V137Z" fill="Canvas" fillOpacity="0.96" />
    <path
      d="M75 106h22m0 0-8-8m8 8-8 8"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SetorSaudeIcon;