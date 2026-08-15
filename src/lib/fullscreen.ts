export const enableFullscreen = async () => {
  const root: any = document.documentElement;

  if (root.requestFullscreen) await root.requestFullscreen();
  else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();

  localStorage.setItem("kiosk_fullscreen", "1");
};
