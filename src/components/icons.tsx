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
