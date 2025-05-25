{ pkgs }: {
  deps = [
    pkgs.firefox
    pkgs.nodejs-18_x
    pkgs.chromium
    pkgs.postgresql
    pkgs.which
    pkgs.findutils
  ];
  
  env = {
    CHROME_BIN = "${pkgs.chromium}/bin/chromium";
    CHROMIUM_BIN = "${pkgs.chromium}/bin/chromium";
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
    PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  };
} 