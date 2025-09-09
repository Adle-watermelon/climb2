function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
export const size = isMobile() ? 60*0.9:60;
export const charaheight = 31/16;
export const charawidth = 16/16
export const synfps = 25;
export const scale = 2;
export const fontSize = isMobile() ? 12 * 0.7 : 12;