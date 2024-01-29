export const t = (s, options) => {
    s = s
        ?.split(' ')
        .map((s, i) => (i == 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
        .join('');
    return i18next.t(s, options);
};
