export const get_random_int = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export const round = (num: number, decimals: number = 2) => {
    return Math.round(num * 10 ** decimals) / 10 ** decimals;
}