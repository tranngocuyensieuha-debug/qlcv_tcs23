import { TAX_LOGO_BASE64 } from './taxLogoData';

export default function TaxLogo({ size = 72, className = '' }: { size?: number; className?: string }) {
  if (TAX_LOGO_BASE64) {
    return (
      <img
        src={TAX_LOGO_BASE64}
        alt="Logo Thuế Nhà Nước"
        width={size}
        height={size}
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          borderRadius: '50%',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
    );
  }

  // Exact vector SVG replica of the official Thuế Nhà Nước emblem
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Thuế Nhà Nước Việt Nam"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Outer yellow border */}
      <circle cx="250" cy="250" r="246" fill="#FFDE00" />
      {/* Red disc */}
      <circle cx="250" cy="250" r="236" fill="#ED1C24" />
      {/* Thin inner yellow accent ring */}
      <circle cx="250" cy="250" r="232" fill="none" stroke="#FFDE00" strokeWidth="2.5" />

      {/* Five-pointed Star at top */}
      <polygon
        points="
          250,70
          273,124
          330,126
          284,162
          301,217
          250,183
          199,217
          216,162
          170,126
          227,124
        "
        fill="#FFDE00"
      />
      {/* Star inner facet lines */}
      <polygon points="250,70 250,150 273,124" fill="#FFCA00" />
      <polygon points="330,126 250,150 284,162" fill="#FFCA00" />
      <polygon points="301,217 250,150 250,183" fill="#FFCA00" />
      <polygon points="199,217 250,150 216,162" fill="#FFCA00" />
      <polygon points="170,126 250,150 227,124" fill="#FFCA00" />

      {/* Left Laurel Wreath */}
      <g fill="#FFDE00" stroke="#ED1C24" strokeWidth="1.5">
        <path d="M 230 400 C 100 370 45 250 65 140 C 70 120 85 95 105 85" fill="none" stroke="#FFDE00" strokeWidth="5" />
        <path d="M 75 125 Q 90 95 115 90 Q 95 110 75 125 Z" />
        <path d="M 95 125 Q 120 100 140 100 Q 115 120 95 125 Z" />
        <path d="M 65 155 Q 70 125 95 120 Q 80 140 65 155 Z" />
        <path d="M 85 155 Q 105 130 130 130 Q 105 150 85 155 Z" />
        <path d="M 55 190 Q 55 160 80 155 Q 70 175 55 190 Z" />
        <path d="M 75 190 Q 95 165 120 165 Q 95 185 75 190 Z" />
        <path d="M 50 230 Q 45 200 70 195 Q 65 215 50 230 Z" />
        <path d="M 70 230 Q 90 205 115 205 Q 90 225 70 230 Z" />
        <path d="M 50 270 Q 45 240 70 235 Q 65 255 50 270 Z" />
        <path d="M 70 270 Q 90 245 115 245 Q 90 265 70 270 Z" />
        <path d="M 55 310 Q 55 280 80 275 Q 75 295 55 310 Z" />
        <path d="M 75 310 Q 95 285 120 285 Q 95 305 75 310 Z" />
        <path d="M 70 350 Q 75 320 100 315 Q 90 335 70 350 Z" />
        <path d="M 90 350 Q 110 325 135 325 Q 110 345 90 350 Z" />
        <path d="M 95 385 Q 105 355 130 350 Q 115 370 95 385 Z" />
        <path d="M 115 385 Q 135 360 160 360 Q 135 380 115 385 Z" />
        <path d="M 130 415 Q 145 385 170 380 Q 150 400 130 415 Z" />
      </g>

      {/* Right Laurel Wreath (mirrored) */}
      <g fill="#FFDE00" stroke="#ED1C24" strokeWidth="1.5" transform="translate(500, 0) scale(-1, 1)">
        <path d="M 230 400 C 100 370 45 250 65 140 C 70 120 85 95 105 85" fill="none" stroke="#FFDE00" strokeWidth="5" />
        <path d="M 75 125 Q 90 95 115 90 Q 95 110 75 125 Z" />
        <path d="M 95 125 Q 120 100 140 100 Q 115 120 95 125 Z" />
        <path d="M 65 155 Q 70 125 95 120 Q 80 140 65 155 Z" />
        <path d="M 85 155 Q 105 130 130 130 Q 105 150 85 155 Z" />
        <path d="M 55 190 Q 55 160 80 155 Q 70 175 55 190 Z" />
        <path d="M 75 190 Q 95 165 120 165 Q 95 185 75 190 Z" />
        <path d="M 50 230 Q 45 200 70 195 Q 65 215 50 230 Z" />
        <path d="M 70 230 Q 90 205 115 205 Q 90 225 70 230 Z" />
        <path d="M 50 270 Q 45 240 70 235 Q 65 255 50 270 Z" />
        <path d="M 70 270 Q 90 245 115 245 Q 90 265 70 270 Z" />
        <path d="M 55 310 Q 55 280 80 275 Q 75 295 55 310 Z" />
        <path d="M 75 310 Q 95 285 120 285 Q 95 305 75 310 Z" />
        <path d="M 70 350 Q 75 320 100 315 Q 90 335 70 350 Z" />
        <path d="M 90 350 Q 110 325 135 325 Q 110 345 90 350 Z" />
        <path d="M 95 385 Q 105 355 130 350 Q 115 370 95 385 Z" />
        <path d="M 115 385 Q 135 360 160 360 Q 135 380 115 385 Z" />
        <path d="M 130 415 Q 145 385 170 380 Q 150 400 130 415 Z" />
      </g>

      {/* Bottom Gear Cog */}
      <g fill="#FFDE00">
        <rect x="232" y="352" width="36" height="30" rx="3" />
        <rect x="168" y="365" width="34" height="28" rx="3" transform="rotate(-22 185 379)" />
        <rect x="298" y="365" width="34" height="28" rx="3" transform="rotate(22 315 379)" />
        <rect x="110" y="398" width="32" height="28" rx="3" transform="rotate(-44 126 412)" />
        <rect x="358" y="398" width="32" height="28" rx="3" transform="rotate(44 374 412)" />
        <path d="M 90 440 C 130 380 370 380 410 440 L 400 480 C 350 430 150 430 100 480 Z" />
        <path d="M 170 480 C 190 425 310 425 330 480 Z" fill="#ED1C24" />
        <path d="M 190 480 C 205 440 295 440 310 480 Z" fill="none" stroke="#FFDE00" strokeWidth="7" />
      </g>

      {/* Horizontal Center Text: THUẾ NHÀ NƯỚC */}
      <text
        x="250"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#FFDE00"
        fontSize="52"
        fontWeight="900"
        fontFamily="'Arial Black', Impact, 'Segoe UI Black', sans-serif"
        letterSpacing="1"
      >
        THUẾ NHÀ NƯỚC
      </text>
    </svg>
  );
}
