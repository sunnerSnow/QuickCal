import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** The filled QuickCal mark, matching `src/app/icon.svg` minus the gold background. */
export const BrandMark = ({ size = 24, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden {...props}>
    <rect x="10" y="14" width="40" height="38" rx="9" fill="#FDF7E1" />
    <path d="M10 23a9 9 0 0 1 9-9h22a9 9 0 0 1 9 9v6H10z" fill="#5D3713" />
    <rect x="17.5" y="8" width="6" height="12" rx="3" fill="#5D3713" stroke="#DEAE0B" strokeWidth="2" />
    <rect x="36.5" y="8" width="6" height="12" rx="3" fill="#5D3713" stroke="#DEAE0B" strokeWidth="2" />
    <g fill="#DEAE0B" opacity=".6">
      <rect x="16" y="34" width="6" height="6" rx="1.5" />
      <rect x="25" y="34" width="6" height="6" rx="1.5" />
      <rect x="34" y="34" width="6" height="6" rx="1.5" />
      <rect x="16" y="43" width="6" height="6" rx="1.5" />
      <rect x="25" y="43" width="6" height="6" rx="1.5" />
    </g>
    <circle cx="47" cy="47" r="11" fill="#5D3713" stroke="#DEAE0B" strokeWidth="3" />
    <path d="M47 41v12M41 47h12" stroke="#FDF7E1" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

export const CalendarCheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="4" />
    <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon strokeWidth={2.4} {...props}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon strokeWidth={3} {...props}>
    <path d="M5 12l5 5 9-10" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon strokeWidth={2.5} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const LogoutIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Icon>
);

export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </Icon>
);

export const ExternalIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
);
