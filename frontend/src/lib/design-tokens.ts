// Design tokens for consistent UI across the application

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
} as const;

export const typography = {
    h1: {
        size: '32px',
        weight: '600',
        lineHeight: '1.2',
        letterSpacing: '-0.02em',
    },
    h2: {
        size: '24px',
        weight: '600',
        lineHeight: '1.3',
        letterSpacing: '-0.01em',
    },
    h3: {
        size: '20px',
        weight: '600',
        lineHeight: '1.4',
    },
    h4: {
        size: '16px',
        weight: '600',
        lineHeight: '1.5',
    },
    body: {
        size: '14px',
        weight: '400',
        lineHeight: '1.5',
    },
    caption: {
        size: '12px',
        weight: '500',
        lineHeight: '1.4',
    },
} as const;

export const cardPadding = {
    sm: '16px',
    md: '20px',
    lg: '24px',
} as const;

export const borderRadius = {
    sm: '8px',
    md: '12px',
    lg: '16px',
} as const;

export const cardHeight = {
    stat: '120px',
    compact: '140px',
    standard: '180px',
} as const;

export const gridGap = {
    tight: '16px',
    normal: '20px',
    relaxed: '24px',
} as const;
