export const getValidDayOff = (dayOff: any[]) => {
  return [...new Array(7)].map((_, idx) => !!dayOff[idx])
}
