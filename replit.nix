{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.postgresql
    pkgs.which
    pkgs.findutils
  ];
  
  env = {
    # Removed browser automation dependencies for lighter deployment
  };
} 